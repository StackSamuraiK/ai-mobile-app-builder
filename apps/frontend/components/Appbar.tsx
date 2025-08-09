import { Button } from "@/components/ui/button"
import {
    ClerkProvider,
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
} from '@clerk/nextjs'
import { Rocket, Sparkles, Code2 } from 'lucide-react'

export function Appbar() {
    return (
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-background via-background to-muted/30 border-b border-border/50 backdrop-blur-sm">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                        <Sparkles className="w-2 h-2 text-white" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        AppOrbit
                    </h1>
                    <p className="text-xs text-muted-foreground -mt-1">Build • Deploy • Scale</p>
                </div>
            </div>

            {/* Navigation Links - Optional middle section */}
            <div className="hidden md:flex items-center space-x-8">
                <nav className="flex items-center space-x-6">
                    <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 hover:scale-105 transform">
                        Projects
                    </a>
                    <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 hover:scale-105 transform">
                        Templates
                    </a>
                    <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 hover:scale-105 transform">
                        Docs
                    </a>
                </nav>
            </div>

            {/* Auth Section */}
            <div className="flex items-center space-x-3">
                <SignedOut>
                    <div className="flex items-center space-x-3">
                        <SignInButton>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-muted/50"
                            >
                                Sign In
                            </Button>
                        </SignInButton>
                        <SignUpButton>
                            <Button 
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-medium text-sm px-6 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0"
                            >
                                <Code2 className="w-4 h-4 mr-2" />
                                Get Started
                            </Button>
                        </SignUpButton>
                    </div>
                </SignedOut>
                <SignedIn>
                    <div className="flex items-center space-x-3">
                        {/* Optional: Add a create project button for signed in users */}
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="hidden sm:flex items-center space-x-2 text-sm font-medium border-border/50 hover:border-border hover:bg-muted/50 transition-all duration-200"
                        >
                            <Code2 className="w-4 h-4" />
                            <span>New Project</span>
                        </Button>
                        <div className="relative">
                            <UserButton 
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9 rounded-full ring-2 ring-border/20 hover:ring-border transition-all duration-200"
                                    }
                                }}
                            />
                            {/* Online indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        </div>
                    </div>
                </SignedIn>
            </div>
        </div>
    )
}