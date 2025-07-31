import { useEffect,useState } from "react";

const LogsViewer=()=>{
    const [logs,setLogs]=useState([])

    useEffect(()=>{
        const fetchLogs=()=>{
            fetch('http://localhost:3001/api/logs')
            .then(res=>res.json())
            .then(setLogs)
            .catch(err=>console.error('fetch failed: ',err))
        }
        fetchLogs()
    },[])
    // console.log(logs)
    return(
        <div className="logs-class">
            {logs.map((log,idx)=>{
                return <div key={idx}>
                        <pre>{JSON.stringify(log, null, 2)}</pre>
                    </div>
            })}
        </div>
    )
}
export default LogsViewer;