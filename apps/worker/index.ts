import express, { response } from "express";
import { GoogleGenAI } from "@google/genai";
import cors from "cors"
import type { Request, Response } from "express";
import { prismaClient } from "db/client";
import { systemPrompt } from "./systemPrompt";
import { ArtifactProcessor } from "./parser";
import { onFileUpdate, onShellCommand } from "./os";

const app = express();

app.use(cors());
app.use(express.json());

app.post('/prompt', async (req: Request, res: Response) => {
    // Add comprehensive logging
    console.log("=== REQUEST DEBUG INFO ===");
    console.log("Full request body:", JSON.stringify(req.body, null, 2));
    console.log("Request headers:", req.headers);
    console.log("Content-Type:", req.headers['content-type']);
    
    const { prompt, prompts, projectId, projectType = "REACT_NATIVE" } = req.body;
    
    // Handle both 'prompt' and 'prompts' field names for backwards compatibility
    const actualPrompt = prompt || prompts;
    
    // Log extracted values
    console.log("Extracted values:");
    console.log("- prompt:", prompt);
    console.log("- prompts:", prompts);
    console.log("- actualPrompt:", actualPrompt);
    console.log("- actualPrompt type:", typeof actualPrompt);
    console.log("- actualPrompt length:", actualPrompt?.length);
    console.log("- projectId:", projectId);
    console.log("- projectType:", projectType);
    
    // Validate required fields
    if (!actualPrompt || actualPrompt.trim().length === 0) {
        console.error("ERROR: Prompt is missing or undefined");
        return res.status(400).json({ 
            error: "Prompt is required and cannot be empty",
            receivedBody: req.body 
        });
    }
    
    if (!projectId) {
        console.error("ERROR: ProjectId is missing");
        return res.status(400).json({ 
            error: "ProjectId is required",
            receivedBody: req.body 
        });
    }

    try {
        const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

        console.log("Creating prompt in database...");
        await prismaClient.prompt.create({
            data: {
                content: actualPrompt,
                projectId: projectId,
                type: "USER"
            }
        });

        console.log("Fetching all prompts for project...");
        const allPrompts = await prismaClient.prompt.findMany({
            where: {
                projectId
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        console.log(`Found ${allPrompts.length} prompts for project`);

        // Convert database prompts to proper Gemini format
        const convertedMessages = allPrompts.map((p) => ({
            role: p.type === "USER" ? "user" : "model",
            parts: [{ text: p.content }]
        }));

        // FIXED: Call systemPrompt as a function with projectType parameter
        const contents = [
            {
                role: "user",
                parts: [{ text: systemPrompt(projectType as "REACT" | "NEXTJS" | "REACT_NATIVE") }]
            },
            ...convertedMessages
        ];

        console.log("Initializing artifact processor...");
        let artifactProcessor = new ArtifactProcessor(
            "", 
            (filePath, fileContent) => onFileUpdate(filePath, fileContent, projectId), 
            (shellCommand) => onShellCommand(shellCommand, projectId)
        );
        let artifact = '';

        console.log("Calling Gemini API...");
        const response = await client.models.generateContentStream({
            model: "gemini-2.0-flash-exp",
            contents: contents,
            config: {
                maxOutputTokens: 8000,
                temperature: 0.7,
            },
        });

        console.log("Processing response stream...");
        for await (const chunk of response) {
            const chunkText = chunk.text;

            //@ts-ignore
            artifactProcessor.append(chunkText);
            artifactProcessor.parse();
            artifact += chunkText;
        }

        console.log("Stream processing complete. Saving system response...");

        await prismaClient.prompt.create({
            data: {
                content: artifact,
                projectId,
                type: "SYSTEM",
            },
        });

        console.log("Response saved successfully!");

        // Send the artifact in response
        res.json({ response: artifact });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ 
            error: 'Failed to generate response',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.listen(9000, () => {
    console.log(`Your worker is listening at 9000`)
})