"use client"

import { WORKER_URL } from "@/config";
import { MessageCircle, Code, Play, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Appbar } from "@/components/Appbar";

export default function ProjectPage({ params }: { params: { projectId: string } }) {
    const [isChatCollapsed, setIsChatCollapsed] = useState(false);

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
            <div className="py-2 px-4">
                <Appbar />
            </div>
            <div className="flex flex-1 bg-background min-h-0">
                {/* Chat Panel */}
                <div className={`${isChatCollapsed ? 'w-12' : 'w-80'} transition-all duration-300 bg-card border-r border-border flex flex-col min-h-0`}>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        {!isChatCollapsed && (
                            <>
                                <div className="flex items-center space-x-2">
                                    <MessageCircle className="w-5 h-5 text-primary" />
                                    <h2 className="font-semibold text-card-foreground">Chat</h2>
                                </div>
                            </>
                        )}
                        <button
                            onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                            className="p-1 hover:bg-accent rounded-md transition-colors"
                        >
                            {isChatCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronLeft className="w-4 h-4 text-muted-foreground" />}
                        </button>
                    </div>

                    {/* Chat Content */}
                    {!isChatCollapsed && (
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 p-4 overflow-y-auto">
                                <div className="space-y-4">
                                    <div className="text-sm text-muted-foreground text-center">
                                        Start a conversation to get help with your project
                                    </div>
                                </div>
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-border">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Ask anything..."
                                        className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm bg-background text-foreground placeholder:text-muted-foreground"
                                    />
                                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Collapsed Chat Icon */}
                    {isChatCollapsed && (
                        <div className="flex-1 flex items-start justify-center pt-4">
                            <MessageCircle className="w-6 h-6 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-card min-h-0">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Code className="w-5 h-5 text-muted-foreground" />
                                <span className="font-medium text-foreground">Project: {params.projectId}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <ThemeToggle />
                            <button className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-sm font-medium">
                                <Play className="w-4 h-4" />
                                <span>Preview</span>
                            </button>
                            <button className="p-2 hover:bg-accent rounded-md transition-colors">
                                <Settings className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Preview Frame */}
                    <div className="flex-1 relative min-h-0">
                        <iframe
                            src={`${WORKER_URL}/`}
                            className="w-full h-full border-0"
                            title="Project Preview"
                        />

                        {/* Loading Overlay */}
                        <div className="absolute inset-0 bg-background/90 flex items-center justify-center pointer-events-none opacity-0 transition-opacity">
                            <div className="flex items-center space-x-2 text-muted-foreground">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span>Loading preview...</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-400 dark:bg-green-500 rounded-full"></div>
                                <span>Connected</span>
                            </div>
                            <span>|</span>
                            <span>Ready</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span>Powered by Workers</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}