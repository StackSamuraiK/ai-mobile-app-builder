import { prismaClient } from "db/client";

const BASE_WORK_DIR = "/tmp/bolty-worker"

if(!Bun.file(BASE_WORK_DIR).exists()){
    Bun.write(BASE_WORK_DIR , "");
}

export async function onFileUpdate(filePath:string , fileContent:string , projectId:string){
    await Bun.write(`${BASE_WORK_DIR}/${filePath}` , fileContent);

    await prismaClient.action.create({
        data:{
            projectId:projectId,
            content: `Updated file ${filePath}`
        }
    })
}

export async function onShellCommand(shellCommand: string , projectId:string){
   console.log(`Executing shell command: ${shellCommand}`);
   
   // Filter out empty commands
   const commands = shellCommand.split("&&")
       .map(cmd => cmd.trim())
       .filter(cmd => cmd.length > 0);
   
   for(const command of commands){
       console.log(`Running Command: ${command}`)
       
       // Split and filter empty parts
       const cmdParts = command.split(/\s+/).filter(part => part.length > 0);
       
       if (cmdParts.length === 0) {
           console.log("Skipping empty command");
           continue;
       }
       
       try {
           const result = Bun.spawnSync(cmdParts, {
               cwd: BASE_WORK_DIR
           });

           await prismaClient.action.create({
            data:{
                projectId,
                content: `Command Run ${commands}`
            }
           })
           
           if (result.stdout) {
               console.log(result.stdout.toString());
           }
           if (result.stderr) {
            //@ts-ignore
               console.log(result.stderr.toString());
           }
       } catch (error) {
           console.error(`Error executing "${command}":`, error);
       }
   }
}