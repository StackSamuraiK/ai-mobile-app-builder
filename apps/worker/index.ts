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

app.post('/prompt' ,async (req: Request, res: Response) => {
    const { prompt, projectId, projectType = "REACT_NATIVE" } = req.body; // Added projectType with default
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

    await prismaClient.prompt.create({
        data: {
            content: prompt,
            projectId: projectId,
            type: "USER"
        }
    });

    const allPrompts = await prismaClient.prompt.findMany({
        where: {
            projectId
        },
        orderBy: {
            createdAt: 'asc'
        }
    })

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

    let artifactProcessor = new ArtifactProcessor("", (filePath ,fileContent)=>onFileUpdate(filePath , fileContent, projectId), (shellCommand)=> onShellCommand(shellCommand , projectId))
    let artifact = '';

    try {
        const response = await client.models.generateContentStream({
            model: "gemini-2.0-flash-exp",
            contents: contents,
            config: {
                maxOutputTokens: 8000,
                temperature: 0.7,
            },
        });

        for await (const chunk of response) {
            const chunkText = chunk.text;

            //@ts-ignore
            artifactProcessor.append(chunkText);
            artifactProcessor.parse();
            artifact += chunkText;
        }

        console.log("done!");

        await prismaClient.prompt.create({
            data: {
                content: artifact,
                projectId,
                type: "SYSTEM",
            },
        });

        // Send the artifact in response
        res.json({ response: artifact });

    } catch (error) {
        console.error('Error with Gemini API:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

app.listen(9000, () => {
    console.log(`Your worker is listening at 9000`)
})