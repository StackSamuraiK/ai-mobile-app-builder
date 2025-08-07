"use client"

import { Appbar } from "@/components/Appbar";
import { WORKER_URL } from "@/config";
import { MessageCircle, Code, Play, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function ProjectPage({ params }: { params: { projectId: string } }) {
    const [isChatCollapsed, setIsChatCollapsed] = useState(false);

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <div className="py-2">
                <Appbar />
            </div>
            <div className="flex flex-1 bg-gray-50 min-h-0">
                {/* Chat Panel */}
                <div className={`${isChatCollapsed ? 'w-12' : 'w-80'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col min-h-0`}>
                    {/* Chat Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        {!isChatCollapsed && (
                            <>
                                <div className="flex items-center space-x-2">
                                    <MessageCircle className="w-5 h-5 text-blue-600" />
                                    <h2 className="font-semibold text-gray-900">Chat</h2>
                                </div>
                            </>
                        )}
                        <button
                            onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            {isChatCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Chat Content */}
                    {!isChatCollapsed && (
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 p-4 overflow-y-auto">
                                <div className="space-y-4">
                                    <div className="text-sm text-gray-500 text-center">
                                        Start a conversation to get help with your project
                                    </div>
                                </div>
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-gray-100">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Ask anything..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Collapsed Chat Icon */}
                    {isChatCollapsed && (
                        <div className="flex-1 flex items-start justify-center pt-4">
                            <MessageCircle className="w-6 h-6 text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-white min-h-0">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Code className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-900">Project: {params.projectId}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button className="flex items-center space-x-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium">
                                <Play className="w-4 h-4" />
                                <span>Preview</span>
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
                                <Settings className="w-4 h-4 text-gray-600" />
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
                        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center pointer-events-none opacity-0 transition-opacity">
                            <div className="flex items-center space-x-2 text-gray-600">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span>Loading preview...</span>
                            </div>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
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