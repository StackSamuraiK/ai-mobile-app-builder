import { BACKEND_URL } from "@/config";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useEffect, useState } from "react";

interface Action{
    id:string,
    content:string,
    createdAt:Date
}

export function useAction(projectId:string){
    const [action , setActions] = useState<Action[]>([])
    const { getToken } = useAuth()

    useEffect(()=>{
        async function getAction(){
            const token = await getToken();
            await axios.get(`${BACKEND_URL}/action/${projectId}` ,{
                headers:{
                    "Authorization" : `Bearer ${token}`
                }
            }).then((res)=>{
                setActions(res.data.action)
            })
        }
        getAction()

        let interval = setInterval(getAction , 1000);
        return ()=> clearInterval(interval);
    } ,[])

    return {
        action,
    }
}