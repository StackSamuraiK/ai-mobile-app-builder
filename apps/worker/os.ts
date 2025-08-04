const BASE_WORK_DIR = "/tmp/bolty-worker"

if(!Bun.file(BASE_WORK_DIR).exists()){
    Bun.write(BASE_WORK_DIR , "");
}

export async function onFileUpdate(filePath:string , fileContent:string){
    await Bun.write(`${BASE_WORK_DIR}/${filePath}` , fileContent);
}

export async function onShellCommand(shellCommand: string){
    const commands = shellCommand.split("&&");
    for(const command of commands){
        console.log(`Running Command: ${command}`)
        const result = Bun.spawnSync({cmd: command.split(" ") , cwd:BASE_WORK_DIR})
        console.log(result.stdout);
        //@ts-ignore
        console.log(result.stderr.toString())
    }
}