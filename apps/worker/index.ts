import express, { response } from "express";
import { GoogleGenAI } from "@google/genai";
import cors from "cors"
import type { Request, Response } from "express";
import { prismaClient } from "db/client";
import { systemPrompt } from "./systemPrompt";

const app = express();

app.use(cors());

app.post('/prompt', async (req: Request, res: Response) => {
    const { prompt, projectId } = req.body
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

    const convertedMessages = allPrompts.map((p) => ({
        role: p.type === "USER" ? "user" : "model",
        parts: [{ text: p.content }]
    }));


    //May cause problem -> will be used later 
    let artifact = '';
    let artifactProcessor = {
        append: (text: string) => {
            artifact += text;
        },
        parse: () => {
            console.log('Processing artifact:', artifact);
        }
    };

    try {
        const response = await client.models.generateContentStream({
            model: "gemini-2.5-flash",
            //@ts-ignore
            contents: {
                role: "user",
                parts: [
                    //@ts-ignore
                    ...convertedMessages.map(msg => ({ text: msg.parts[0].text })),
                    {text:systemPrompt}
                ]
            },
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

    } catch (error) {
        console.error('Error with Gemini API:', error);
    }

    res.json({ response })
})