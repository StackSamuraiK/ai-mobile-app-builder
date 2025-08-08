import { BACKEND_URL } from "@/config";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { headers } from "next/headers";
import { useEffect, useState } from "react";

interface Prompt {
   id: string,
   content: string,
   type: "USER" | "SYSTEM",
   createdAt: Date
}

export function usePrompt(projectId: string) {
   const [prompts, setPrompts] = useState<Prompt[]>([])
   const { getToken } = useAuth();

   useEffect(() => {
       async function getPrompts() {
           const token = await getToken();
           axios.get(`${BACKEND_URL}/prompts/${projectId}`, {
               headers: {
                   "Authorization": `Bearer ${token}`
               }
           }).then((res) => {
               setPrompts(res.data)
           })
       }
       getPrompts()

       let interval = setInterval(getPrompts, 1000);
       return () => clearInterval(interval);
   }, [])

   return {
       prompts,
   }
}