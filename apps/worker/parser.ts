export class ArtifactProcessor {
    public currentArtifact: string;
    private onFileContent: (filePath: string, fileContent: string) => void;
    private onShellCommand: (shellCommand: string) => void;

    constructor(
        currentArtifact: string, 
        onFileContent: (filePath: string, fileContent: string) => void, 
        onShellCommand: (shellCommand: string) => void
    ) {
        this.currentArtifact = currentArtifact;
        this.onFileContent = onFileContent;
        this.onShellCommand = onShellCommand;
    }

    append(artifact: string): void {
        this.currentArtifact += artifact;
    }

    parse(): void {
        const lines = this.currentArtifact.split("\n");
        
        const latestActionStart = lines.findIndex((line) => line.includes("<boltAction type="));
        const latestActionEnd = lines.findIndex((line) => line.includes("</boltAction>"));

        if (latestActionStart === -1) {
            return;
        }

        // Use the actual end index or default to last line
        const actionEndIndex = latestActionEnd !== -1 ? latestActionEnd : lines.length - 1;

        try {
            const actionStartLine = lines[latestActionStart];
            if (!actionStartLine) {
                return;
            }

            // Extract action type more safely
            const typeMatch = actionStartLine.match(/type=["']?([^"'\s>]+)["']?/);
            if (!typeMatch) {
                return;
            }

            const latestActionType = typeMatch[1];
            const latestActionContent = lines.slice(latestActionStart, actionEndIndex + 1).join("\n");

            if (latestActionType === "shell") {
                this.handleShellAction(latestActionContent);
            } else if (latestActionType === "file") {
                this.handleFileAction(actionStartLine, latestActionContent);
            }
        } catch (error) {
            console.error('Error parsing artifact:', error);
        }
    }

    private handleShellAction(latestActionContent: string): void {
        const contentLines = latestActionContent.split('\n');
        if (contentLines.length < 2) {
            return;
        }

        let shellCommand = contentLines.slice(1).join('\n');
        
        if (shellCommand.includes("</boltAction>")) {
            const closingTagIndex = shellCommand.indexOf("</boltAction>");
            shellCommand = shellCommand.substring(0, closingTagIndex);
            
            // Remove the processed action from currentArtifact
            const actionIndex = this.currentArtifact.indexOf(latestActionContent);
            if (actionIndex !== -1) {
                const afterAction = this.currentArtifact.substring(actionIndex + latestActionContent.length);
                this.currentArtifact = afterAction;
            }
            
            this.onShellCommand(shellCommand);
        }
    }

    private handleFileAction(actionStartLine: string, latestActionContent: string): void {
        // Extract file path more safely
        const filePathMatch = actionStartLine.match(/filePath=["']?([^"'\s>]+)["']?/);
        if (!filePathMatch) {
            return;
        }

        const filePath = filePathMatch[1];
        const contentLines = latestActionContent.split("\n");
        
        if (contentLines.length < 2) {
            return;
        }

        let fileContent = contentLines.slice(1).join("\n");
        
        if (fileContent.includes("</boltAction>")) {
            const closingTagIndex = fileContent.indexOf("</boltAction>");
            fileContent = fileContent.substring(0, closingTagIndex);
            
            // Remove the processed action from currentArtifact
            const actionIndex = this.currentArtifact.indexOf(latestActionContent);
            if (actionIndex !== -1) {
                const afterAction = this.currentArtifact.substring(actionIndex + latestActionContent.length);
                this.currentArtifact = afterAction;
            }
            
            //@ts-ignore
            this.onFileContent(filePath, fileContent);
        }
    }
}
