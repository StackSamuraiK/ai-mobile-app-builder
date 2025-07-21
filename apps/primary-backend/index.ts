import { prismaClient } from "db/client";
import express from "express";
import cors from "cors";
import dotenv from "dotenv"
import { authMiddleware } from "./middlewares";

dotenv.config();

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.json({ 
        message: "Server is running!", 
        timestamp: new Date().toISOString() 
    });
});

app.post('/project' , authMiddleware ,async(req , res)=>{
    const { prompt } = req.body
    const userId = req.userId;

     if (userId === undefined) {
        return res.status(401).json({
            msg: "User not authenticated"
        });
    }
    
    //add logic to get useful names of prompts for description
    const description = prompt.split("\n")[0];
    const project = await prismaClient.project.create({
        data:{
            description,
            userId: userId  
        }
    });
    res.json({projectId : project.id});
})

app.get('/projects' , authMiddleware ,async(req , res) =>{
    const userId = req.userId;

    const projects = await prismaClient.project.findFirst({
        where:{userId}
    })
    
    res.json({projects})
});

app.listen(port , ()=>{
    console.log(`Your app is listening on port ${port}`)
});
