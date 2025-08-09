"use client"

import { Textarea } from "@/components/ui/textarea"
import { Send, Sparkles, Rocket, Code2, Zap } from "lucide-react"
import { Button } from "./ui/button"
import { useState } from "react"
import axios from "axios"
import { useAuth } from "@clerk/nextjs"
import { BACKEND_URL, WORKER_API_URL } from "@/config"
import { useRouter } from "next/navigation"

export function Prompt() {
    const [prompt, setPrompt] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { getToken } = useAuth();
    const router = useRouter();

    const handleSubmit = async () => {
        if (!prompt.trim()) return;
        
        setIsLoading(true);
        try {
            const token = await getToken();
            const response = await axios.post(`${BACKEND_URL}/project`, {
                prompt: prompt
            }, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            
            axios.post(`${WORKER_API_URL}/prompt`, {
                projectId: response.data.projectId,
                prompt: prompt
            })
            
            router.push(`/project/${response.data.projectId}`)
            console.log(response.data.projectId)
        } catch (error) {
            console.error('Error creating project:', error);
            // You might want to show an error toast here
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const examplePrompts = [
        "Create a workout planning app with exercises and progress tracking",
        "Build a todo app with categories and due dates",
        "Make a weather dashboard with multiple city support",
        "Design a recipe sharing platform with ratings"
    ];

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                    <div className="relative">
                        <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        What would you like to build?
                    </h2>
                    <div className="relative">
                        <Rocket className="w-6 h-6 text-blue-500 animate-bounce" />
                    </div>
                </div>
                <p className="text-muted-foreground text-lg">
                    Describe your app idea and watch it come to life with AI-powered development
                </p>
            </div>

            {/* Main Prompt Input */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-background/80 backdrop-blur-sm border-2 border-border/50 hover:border-border transition-all duration-300 rounded-2xl p-1">
                    <Textarea 
                        placeholder="Create workout planning app with exercise tracking, progress charts, and social features..."
                        value={prompt} 
                        onChange={(e) => { setPrompt(e.target.value) }}
                        onKeyDown={handleKeyPress}
                        className="min-h-[120px] resize-none border-0 bg-transparent text-lg placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 p-6"
                        disabled={isLoading}
                    />
                    
                    <div className="flex items-center justify-between p-4 pt-0">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <Code2 className="w-4 h-4" />
                                <span>Press Ctrl+Enter to create</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-xs text-muted-foreground">AI Ready</span>
                            </div>
                        </div>
                        
                        <Button 
                            onClick={handleSubmit}
                            disabled={!prompt.trim() || isLoading}
                            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-medium px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0 disabled:opacity-50 disabled:transform-none disabled:shadow-lg"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Create App
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Example Prompts */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Try these examples</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {examplePrompts.map((example, index) => (
                        <button
                            key={index}
                            onClick={() => setPrompt(example)}
                            disabled={isLoading}
                            className="text-left p-4 rounded-xl border border-border/50 hover:border-border bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                                {example}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
                <div className="text-center space-y-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg mx-auto flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Instant Deploy</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Your app goes live immediately</p>
                </div>
                
                <div className="text-center space-y-2 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/50">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg mx-auto flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">AI Powered</h4>
                    <p className="text-xs text-purple-700 dark:text-purple-300">Smart code generation & optimization</p>
                </div>
                
                <div className="text-center space-y-2 p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-950/30 dark:to-pink-900/20 border border-pink-200/50 dark:border-pink-800/50">
                    <div className="w-10 h-10 bg-pink-500 rounded-lg mx-auto flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-medium text-pink-900 dark:text-pink-100">Full Stack</h4>
                    <p className="text-xs text-pink-700 dark:text-pink-300">Frontend, backend, and database</p>
                </div>
            </div>
        </div>
    )
}