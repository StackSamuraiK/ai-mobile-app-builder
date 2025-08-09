"use client"

import { WORKER_API_URL, WORKER_URL } from "@/config";
import { MessageCircle, Code, Play, Settings, ChevronLeft, ChevronRight, Terminal, FileText, Zap, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Appbar } from "@/components/Appbar";
import { usePrompt } from "@/hooks/usePrompt";
import { useAction } from "@/hooks/useActions";
import axios from "axios";

// Helper function to determine action type and get appropriate styling
const getActionTypeInfo = (content: string) => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('npm install') || lowerContent.includes('yarn add') || lowerContent.includes('pnpm add')) {
        return {
            type: 'install',
            icon: <Zap className="w-4 h-4" />,
            bgColor: 'bg-blue-50 dark:bg-blue-950/30',
            borderColor: 'border-blue-200 dark:border-blue-800',
            iconColor: 'text-blue-600 dark:text-blue-400',
            title: 'Package Installation'
        };
    }
    
    if (lowerContent.includes('creating') || lowerContent.includes('created') || lowerContent.includes('generating')) {
        return {
            type: 'create',
            icon: <FileText className="w-4 h-4" />,
            bgColor: 'bg-green-50 dark:bg-green-950/30',
            borderColor: 'border-green-200 dark:border-green-800',
            iconColor: 'text-green-600 dark:text-green-400',
            title: 'File Created'
        };
    }
    
    if (lowerContent.includes('updating') || lowerContent.includes('updated') || lowerContent.includes('modifying')) {
        return {
            type: 'update',
            icon: <FileText className="w-4 h-4" />,
            bgColor: 'bg-amber-50 dark:bg-amber-950/30',
            borderColor: 'border-amber-200 dark:border-amber-800',
            iconColor: 'text-amber-600 dark:text-amber-400',
            title: 'File Updated'
        };
    }
    
    if (lowerContent.includes('running') || lowerContent.includes('executing') || lowerContent.includes('$')) {
        return {
            type: 'command',
            icon: <Terminal className="w-4 h-4" />,
            bgColor: 'bg-slate-50 dark:bg-slate-950/30',
            borderColor: 'border-slate-200 dark:border-slate-800',
            iconColor: 'text-slate-600 dark:text-slate-400',
            title: 'Command Execution'
        };
    }
    
    if (lowerContent.includes('error') || lowerContent.includes('failed') || lowerContent.includes('exception')) {
        return {
            type: 'error',
            icon: <AlertCircle className="w-4 h-4" />,
            bgColor: 'bg-red-50 dark:bg-red-950/30',
            borderColor: 'border-red-200 dark:border-red-800',
            iconColor: 'text-red-600 dark:text-red-400',
            title: 'Error'
        };
    }
    
    if (lowerContent.includes('completed') || lowerContent.includes('success') || lowerContent.includes('done')) {
        return {
            type: 'success',
            icon: <CheckCircle className="w-4 h-4" />,
            bgColor: 'bg-green-50 dark:bg-green-950/30',
            borderColor: 'border-green-200 dark:border-green-800',
            iconColor: 'text-green-600 dark:text-green-400',
            title: 'Completed'
        };
    }
    
    // Default case
    return {
        type: 'info',
        icon: <Clock className="w-4 h-4" />,
        bgColor: 'bg-gray-50 dark:bg-gray-950/30',
        borderColor: 'border-gray-200 dark:border-gray-800',
        iconColor: 'text-gray-600 dark:text-gray-400',
        title: 'Processing'
    };
};

// Action item component
const ActionItem = ({ action }: { action: any }) => {
    const typeInfo = getActionTypeInfo(action.content);
    
    return (
        <div className={`rounded-lg border ${typeInfo.borderColor} ${typeInfo.bgColor} p-4 space-y-3 transition-all duration-200 hover:shadow-sm`}>
            <div className="flex items-center space-x-3">
                <div className={`${typeInfo.iconColor} flex-shrink-0`}>
                    {typeInfo.icon}
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-foreground">{typeInfo.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex-shrink-0">
                    {typeInfo.type === 'success' && (
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                    {typeInfo.type === 'error' && (
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    )}
                    {typeInfo.type === 'command' && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    )}
                    {!['success', 'error', 'command'].includes(typeInfo.type) && (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                </div>
            </div>
            
            <div className="bg-background/50 rounded-md p-3 border border-border/50">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {action.content}
                </pre>
            </div>
        </div>
    );
};

export default function ProjectPage({ params }: { params: { projectId: string } }) {
    const [isChatCollapsed, setIsChatCollapsed] = useState(false);
    const { prompt } = usePrompt(params.projectId);
    const { action } = useAction(params.projectId)
    const [promptInput, setPromptInput] = useState(""); // Renamed for clarity
    const [isLoading, setIsLoading] = useState(false); // Add loading state
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Auto-scroll to bottom when new actions are added
    useEffect(() => {
        if (shouldAutoScroll && chatScrollRef.current) {
            // Use requestAnimationFrame to ensure DOM is updated
            requestAnimationFrame(() => {
                if (chatScrollRef.current) {
                    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
                }
            });
        }
    }, [action, shouldAutoScroll]);

    // Check if user is near bottom to determine auto-scroll behavior
    const handleScroll = () => {
        if (chatScrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
            const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
            setShouldAutoScroll(isNearBottom);
        }
    };

    // Smooth scroll to bottom function
    const scrollToBottom = () => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTo({
                top: chatScrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
            setShouldAutoScroll(true);
        }
    };

    const handleSendPrompt = async () => {
        if (!promptInput.trim()) {
            console.error("Prompt cannot be empty");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${WORKER_API_URL}/prompt`, {
                projectId: params.projectId,
                prompt: promptInput.trim()
            });
            
            console.log("Prompt sent successfully:", response.data);
            setPromptInput(""); // Clear the input after successful send
            setShouldAutoScroll(true); // Ensure auto-scroll after sending
            
        } catch (error) {
            console.error("Error sending prompt:", error);
            // You might want to show a user-friendly error message here
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendPrompt();
        }
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-background">
            <div className="py-2 px-4">
                <Appbar />
            </div>
            <div className="flex flex-1 bg-background min-h-0">
                {/* Chat Panel */}
                <div className={`${isChatCollapsed ? 'w-12' : 'w-96'} transition-all duration-300 bg-card border-r border-border flex flex-col min-h-0`}>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        {!isChatCollapsed && (
                            <>
                                <div className="flex items-center space-x-2">
                                    <MessageCircle className="w-5 h-5 text-primary" />
                                    <h2 className="font-semibold text-card-foreground">Build Log</h2>
                                </div>
                                <div className="flex items-center space-x-1 px-2 py-1 bg-background/50 rounded-md">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-muted-foreground">Live</span>
                                </div>
                            </>
                        )}
                        <button
                            onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                            className="p-1.5 hover:bg-accent rounded-md transition-colors"
                        >
                            {isChatCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronLeft className="w-4 h-4 text-muted-foreground" />}
                        </button>
                    </div>

                    {/* Chat Content */}
                    {!isChatCollapsed && (
                        <div className="flex-1 flex flex-col">
                            {/* Activity Feed */}
                            <div className="flex-1 relative">
                                <div 
                                    ref={chatScrollRef}
                                    onScroll={handleScroll}
                                    className="absolute inset-0 p-4 overflow-y-auto scroll-smooth"
                                    style={{ scrollbarWidth: 'thin' }}
                                >
                                    <div className="space-y-4">
                                        {action.length === 0 ? (
                                            <div className="text-center py-8">
                                                <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                                <h3 className="text-sm font-medium text-foreground mb-2">No activity yet</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Start a conversation to see build logs and file changes
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2 mb-4">
                                                    <h3 className="text-sm font-medium text-foreground">Activity Feed</h3>
                                                    <div className="flex-1 h-px bg-border"></div>
                                                    <span className="text-xs text-muted-foreground">{action.length} actions</span>
                                                </div>
                                                
                                                {action.map((actionItem) => (
                                                    <ActionItem key={actionItem.id} action={actionItem} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Scroll to bottom button - only show when not auto-scrolling */}
                                {!shouldAutoScroll && action.length > 0 && (
                                    <button
                                        onClick={scrollToBottom}
                                        className="absolute bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 z-10"
                                        title="Scroll to bottom"
                                    >
                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                    </button>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-border bg-muted/20">
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Terminal className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm font-medium text-foreground">Ask AI</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <input
                                            type="text"
                                            placeholder="Describe what you want to build or modify..."
                                            value={promptInput}
                                            onChange={(e) => setPromptInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            disabled={isLoading}
                                            className="flex-1 px-3 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 transition-colors"
                                        />
                                        <button
                                            onClick={handleSendPrompt}
                                            disabled={isLoading || !promptInput.trim()}
                                            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] flex items-center justify-center">
                                            {isLoading ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                                            ) : (
                                                "Send"
                                            )}
                                        </button>
                                    </div>
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
                    <div className="flex-1 relative min-h-0 p-2">
                        <iframe
                            src={`${WORKER_URL}/`}
                            className="w-full h-full border-0 rounded-lg"
                            title="Project Preview"
                        />

                        {/* Loading Overlay */}
                        <div className="absolute inset-0 bg-background/90 flex items-center justify-center pointer-events-none opacity-0 transition-opacity rounded-lg">
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