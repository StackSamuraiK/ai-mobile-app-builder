"use client"

import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { Button } from "./ui/button"
import { useState } from "react"
import axios from "axios"
import { useAuth } from "@clerk/nextjs"
import { BACKEND_URL } from "@/config"
import { useRouter } from "next/navigation"

export function Prompt() {

    const [prompt, setPrompt] = useState("")
    const {getToken} = useAuth();
    const router = useRouter();
    return (
        <div>
            <Textarea placeholder="Create workout planning app..." value={prompt} onChange={(e) => { setPrompt(e.target.value) }} />
            <div className="flex justify-end pt-2">
                <Button onClick={async () => {
                    const token = await getToken();
                    const response = await axios.post(`${BACKEND_URL}/project`, {
                        prompt: prompt
                    }, {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    })
                    router.push(`/project/${response.data.projectId}`)
                }}>
                    <Send />
                </Button>
            </div>
        </div>
    )
}