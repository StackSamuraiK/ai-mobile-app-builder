import express from "express";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import type { Request, Response } from "express";
import PQueue from "p-queue";

import { prismaClient } from "db/client";
import { systemPrompt } from "./systemPrompt";
import { ArtifactProcessor } from "./parser";
import { onFileUpdate, onShellCommand } from "./os";

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------- Config -------------------- */
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.warn("Warning: API_KEY is not set. The GenAI client will likely fail to initialize.");
}
const client = new GoogleGenAI({ apiKey: API_KEY });

// concurrency queue to limit parallel model calls (tweak concurrency)
const generateQueue = new PQueue({ concurrency: 3 });

/* -------------------- Utilities -------------------- */
function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

function jitteredDelay(baseDelay: number, attempt: number) {
    const exp = baseDelay * (2 ** attempt);
    const jitter = Math.floor(Math.random() * baseDelay);
    return exp + jitter;
}

/**
 * Try to list models and return canonical model ids array.
 * Adapts to different SDK shapes.
 */
async function listAllModels(): Promise<Array<{ id: string; supportedMethods: string[] }>> {
    try {
        let resp: any = null;
        if (typeof (client as any).listModels === "function") {
            resp = await (client as any).listModels();
        } else if ((client as any).models && typeof (client as any).models.list === "function") {
            resp = await (client as any).models.list();
        } else {
            // SDK doesn't expose list method on top-level - can't discover models
            console.warn("listModels method not found on client; skipping discovery.");
            return [];
        }

        const models = resp?.models || resp?.model || resp || [];
        const out: Array<{ id: string; supportedMethods: string[] }> = [];

        for (const m of models) {
            const id = m?.name || m?.id || m?.model || m?.modelId || m?.model_name;
            if (!id) continue;
            const methods = m?.supportedMethods || m?.methods || m?.capabilities || m?.features || [];
            out.push({ id, supportedMethods: Array.isArray(methods) ? methods : [] });
        }
        return out;
    } catch (err) {
        console.warn("Error listing models:", err);
        return [];
    }
}

/* -------------------- Safe generation helpers -------------------- */

/**
 * safeGenerateStream:
 * - attempts to open a streaming generation (generateContentStream) against preferred models,
 *   falls back across discovered models, and retries transient errors with exponential backoff + jitter.
 * - returns { modelId, stream }
 */
async function safeGenerateStream(
    preferredModels: string[],
    payload: any,
    opts?: { retries?: number; baseDelay?: number }
): Promise<{ modelId: string; stream: AsyncIterable<any> }> {
    const retries = opts?.retries ?? 5;
    const baseDelay = opts?.baseDelay ?? 500;

    // Discover models that likely support streaming
    const discovered = await listAllModels();
    // Build ordered model list: preferred first, then discovered others not in preferred
    const ordered: string[] = [];
    const seen = new Set<string>();
    for (const p of preferredModels) {
        if (!seen.has(p)) { ordered.push(p); seen.add(p); }
    }
    for (const d of discovered) {
        if (!seen.has(d.id) && (d.supportedMethods.includes("generateContentStream") || d.supportedMethods.length === 0)) {
            // If supportedMethods includes the streaming capability OR methods unknown include it heuristically
            ordered.push(d.id);
            seen.add(d.id);
        }
    }

    if (ordered.length === 0) {
        // if we couldn't discover models, still try preferred list (maybe dashboard shows them)
        if (preferredModels.length === 0) {
            throw new Error("No candidate models available for streaming generation. Check ListModels and billing.");
        }
        for (const p of preferredModels) {
            if (!seen.has(p)) { ordered.push(p); seen.add(p); }
        }
    }

    let lastErr: any = null;

    for (const modelId of ordered) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                // Determine streaming method
                const streamMethod =
                    (client as any).models?.generateContentStream
                        ? (client as any).models.generateContentStream.bind((client as any).models)
                        : (client as any).generateContentStream
                            ? (client as any).generateContentStream.bind(client)
                            : null;

                if (!streamMethod) {
                    throw new Error("generateContentStream method not found on the GenAI client. Consider using non-streaming fallback.");
                }

                const responseStream = await streamMethod({
                    model: modelId,
                    ...payload
                });

                // Return as soon as we get a stream
                return { modelId, stream: responseStream };
            } catch (err: any) {
                lastErr = err;
                const code = err?.code || err?.status || (() => {
                    try {
                        const parsed = JSON.parse(err?.message || "{}");
                        return parsed?.error?.code || parsed?.code;
                    } catch (_) { return undefined; }
                })();

                if (code === 404 || /not found|is not found|unsupported/i.test(String(err?.message || ""))) {
                    console.warn(`[safeGenerateStream] model ${modelId} not found or unsupported for streaming. Trying next model.`, err?.message || err);
                    break; // move to next model
                }

                const transient = (code === 503 || code === 429 || code === 500) || /overload|temporar/i.test(String(err?.message || ""));
                if (transient && attempt < retries - 1) {
                    const delay = jitteredDelay(baseDelay, attempt);
                    console.warn(`[safeGenerateStream] transient error for ${modelId} (attempt ${attempt + 1}). retrying after ${delay}ms`, err?.message || err);
                    await sleep(delay);
                    continue; // retry same model
                }

                console.warn(`[safeGenerateStream] failing ${modelId} (attempt ${attempt + 1}):`, err?.message || err);
                break; // move to next model
            }
        }
    }

    const message = lastErr ? `All streaming model attempts failed. Last error: ${lastErr.message || lastErr}` : "All streaming attempts failed.";
    const e = new Error(message);
    (e as any).cause = lastErr;
    throw e;
}

/**
 * safeGenerateNonStream:
 * - fallback for non-streaming generation (generateContent / generate)
 * - similar retries + fallback logic
 * - returns { modelId, response }
 */
async function safeGenerateNonStream(
    preferredModels: string[],
    payload: any,
    opts?: { retries?: number; baseDelay?: number }
): Promise<{ modelId: string; response: any }> {
    const retries = opts?.retries ?? 5;
    const baseDelay = opts?.baseDelay ?? 500;

    const discovered = await listAllModels();
    const ordered: string[] = [];
    const seen = new Set<string>();
    for (const p of preferredModels) {
        if (!seen.has(p)) { ordered.push(p); seen.add(p); }
    }
    for (const d of discovered) {
        if (!seen.has(d.id) && (d.supportedMethods.includes("generateContent") || d.supportedMethods.length === 0)) {
            ordered.push(d.id);
            seen.add(d.id);
        }
    }
    if (ordered.length === 0) {
        if (preferredModels.length === 0) {
            throw new Error("No candidate models available for non-streaming generation.");
        }
        for (const p of preferredModels) {
            if (!seen.has(p)) { ordered.push(p); seen.add(p); }
        }
    }

    let lastErr: any = null;

    for (const modelId of ordered) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const genMethod =
                    (client as any).models?.generateContent
                        ? (client as any).models.generateContent.bind((client as any).models)
                        : (client as any).generateContent
                            ? (client as any).generateContent.bind(client)
                            : null;

                if (!genMethod) {
                    throw new Error("Non-streaming generate method not found on GenAI client.");
                }

                const resp = await genMethod({
                    model: modelId,
                    ...payload,
                });

                return { modelId, response: resp };
            } catch (err: any) {
                lastErr = err;
                const code = err?.code || err?.status || (() => {
                    try {
                        const parsed = JSON.parse(err?.message || "{}");
                        return parsed?.error?.code || parsed?.code;
                    } catch (_) { return undefined; }
                })();

                if (code === 404 || /not found|is not found|unsupported/i.test(String(err?.message || ""))) {
                    console.warn(`[safeGenerateNonStream] model ${modelId} not found/unsupported. Trying next model.`, err?.message || err);
                    break;
                }

                const transient = (code === 503 || code === 429 || code === 500) || /overload|temporar/i.test(String(err?.message || ""));
                if (transient && attempt < retries - 1) {
                    const delay = jitteredDelay(baseDelay, attempt);
                    console.warn(`[safeGenerateNonStream] transient error for ${modelId} (attempt ${attempt + 1}). retrying after ${delay}ms`, err?.message || err);
                    await sleep(delay);
                    continue;
                }

                console.warn(`[safeGenerateNonStream] failing ${modelId} (attempt ${attempt + 1}):`, err?.message || err);
                break;
            }
        }
    }

    const message = lastErr ? `All non-streaming attempts failed. Last error: ${lastErr.message || lastErr}` : "All non-streaming attempts failed.";
    const e = new Error(message);
    (e as any).cause = lastErr;
    throw e;
}

/* -------------------- Route handler -------------------- */
app.post("/prompt", async (req: Request, res: Response) => {
    console.log("=== REQUEST DEBUG INFO ===");
    console.log("Full request body:", JSON.stringify(req.body, null, 2));
    console.log("Request headers:", req.headers);
    console.log("Content-Type:", req.headers["content-type"]);

    const { prompt, prompts, projectId, projectType = "REACT_NATIVE" } = req.body;
    const actualPrompt = prompt || prompts;

    console.log("Extracted values:");
    console.log("- prompt:", prompt);
    console.log("- prompts:", prompts);
    console.log("- actualPrompt:", actualPrompt);
    console.log("- actualPrompt type:", typeof actualPrompt);
    console.log("- actualPrompt length:", actualPrompt?.length);
    console.log("- projectId:", projectId);
    console.log("- projectType:", projectType);

    if (!actualPrompt || (typeof actualPrompt === "string" && actualPrompt.trim().length === 0)) {
        console.error("ERROR: Prompt is missing or undefined");
        return res.status(400).json({
            error: "Prompt is required and cannot be empty",
            receivedBody: req.body,
        });
    }

    if (!projectId) {
        console.error("ERROR: projectId is missing");
        return res.status(400).json({
            error: "ProjectId is required",
            receivedBody: req.body,
        });
    }

    try {
        // Save user's prompt to DB
        console.log("Creating prompt in database...");
        await prismaClient.prompt.create({
            data: {
                content: actualPrompt,
                projectId: projectId,
                type: "USER",
            },
        });

        console.log("Fetching all prompts for project...");
        const allPrompts = await prismaClient.prompt.findMany({
            where: { projectId },
            orderBy: { createdAt: "asc" },
        });
        console.log(`Found ${allPrompts.length} prompts for project`);

        const convertedMessages = allPrompts.map((p) => ({
            role: p.type === "USER" ? "user" : "model",
            parts: [{ text: p.content }],
        }));

        const contents = [
            {
                role: "model",
                parts: [{ text: systemPrompt(projectType as "REACT" | "NEXTJS" | "REACT_NATIVE") }],
            },
            ...convertedMessages,
        ];

        // Artifact processor
        console.log("Initializing artifact processor...");
        const artifactProcessor = new ArtifactProcessor(
            "",
            (filePath: string, fileContent: string) => onFileUpdate(filePath, fileContent, projectId),
            (shellCommand: string) => onShellCommand(shellCommand, projectId)
        );
        let artifact = "";

        // Preferred models list (ordered): you can adjust according to your dashboard
        const preferredModels = ["gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash"];

        // Build payload for model call consistent with generateContentStream / generateContent
        const payload = {
            contents,
            config: {
                maxOutputTokens: 9000,
                temperature: 0.7,
            },
        };

        // Use queue to limit concurrency (wrap the whole generation flow)
        const result = await generateQueue.add(async () => {
            // 1) Try streaming path
            try {
                console.log("Attempting safeGenerateStream (with fallback + retries)...");
                const { modelId, stream } = await safeGenerateStream(preferredModels, payload, { retries: 6, baseDelay: 400 });
                console.log("Using streaming model:", modelId);
                console.log("Processing response stream...");
                for await (const chunk of stream) {
                    // SDK chunk shapes may vary; handle common shapes
                    const chunkText = chunk?.text ?? chunk?.delta?.content ?? chunk?.content ?? "";
                    if (chunkText && chunkText.length) {
                        // Append and parse as before
                        // @ts-ignore
                        artifactProcessor.append(chunkText);
                        artifactProcessor.parse();
                        artifact += chunkText;
                    }
                }
                return { mode: "stream", usedModel: modelId };
            } catch (streamErr) {
                const errMsg = (streamErr as Error)?.message || String(streamErr);
                console.warn("Streaming failed; falling back to non-streaming generation:", errMsg);
                // 2) Non-streaming fallback
                const fallback = await safeGenerateNonStream(preferredModels, payload, { retries: 6, baseDelay: 400 });
                console.log("Using non-streaming model:", fallback.modelId);
                // The SDK non-streaming response shapes vary; try to extract text
                let generatedText = "";
                if (Array.isArray(fallback.response?.outputs)) {
                    // some shapes: outputs[n].content or outputs[n].text
                    generatedText = fallback.response.outputs.map((o: any) => o?.content ?? o?.text ?? JSON.stringify(o)).join("");
                } else if (fallback.response?.output?.[0]?.content) {
                    generatedText = fallback.response.output.map((o: any) => o.content).join("");
                } else if (typeof fallback.response?.text === "string") {
                    generatedText = fallback.response.text;
                } else {
                    generatedText = JSON.stringify(fallback.response);
                }

                if (generatedText) {
                    // @ts-ignore
                    artifactProcessor.append(generatedText);
                    artifactProcessor.parse();
                    artifact += generatedText;
                }

                return { mode: "non-stream", usedModel: fallback.modelId };
            }
        });

        // Save system response
        console.log("Stream processing complete. Saving system response...");
        await prismaClient.prompt.create({
            data: {
                content: artifact,
                projectId,
                type: "SYSTEM",
            },
        });

        console.log("Response saved successfully! Returning artifact.");
        res.json({ response: artifact, meta: result });
    } catch (error) {
        // Full error serialization
        try {
            console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } catch (e) {
            console.error("Error serializing error object:", e);
            console.error("Raw error:", error);
        }

        const message = error instanceof Error ? error.message : "Unknown error";
        const hint = /503|overload|temporar/i.test(String(message)) ? "Transient model overload — consider retrying later (backoff) or enable billing." : undefined;

        res.status(500).json({
            error: "Failed to generate response",
            details: message,
            hint,
        });
    }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 9000;
app.listen(PORT, () => {
    console.log(`Your worker is listening at ${PORT}`);
});
