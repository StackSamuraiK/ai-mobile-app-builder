import { WORKER_URL } from "@/config";



export default function ProjectPage({params} : {params: {projectId : string}}){
    return (
        <div className="flex h-screen">
            <div className="w-1/4 ">
                Chat window
            </div>
            <div className="w-3/4 w-100">
                <iframe src={`${WORKER_URL}/`}/>
            </div>
            
        </div>
    )
}