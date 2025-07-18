import { prismaClient } from "db/client";
import express from "express";
import { Request, Response } from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.post('/project' , async(req: Request , res: Response)=>{
    
})

app.listen(3000);
