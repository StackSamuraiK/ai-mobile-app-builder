import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { Button } from "./ui/button"

export function Prompt() {
    return (
        <div>
            <Textarea placeholder="Create workout planning app..." />
            <div className="flex justify-end pt-2">
                <Button>
                    <Send />
                </Button>
            </div>
        </div>
    )
}