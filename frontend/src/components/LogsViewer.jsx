import { useEffect, useState } from "react";

export default function LogsViewer() {
  const [logs, setLogs] = useState([
    {"Timestamp":"2025-08-19T16:43:37.3230197+05:30","EventType":"ProcessStop","ProcessName":"","Pid":7592,"FilePath":null,"Extra":null},
        {"Timestamp":"2025-08-21T14:28:02.9019034+05:30","EventType":"ProcessStart","ProcessName":"chrome","Pid":16848,"FilePath":null,"Extra":{"ParentPid":21836,"ImageFileName":"chrome.exe"}},
        {"Timestamp":"2025-08-21T14:28:02.9440511+05:30","EventType":"ProcessStop","ProcessName":"","Pid":22408,"FilePath":null,"Extra":null},
        {"Timestamp":"2025-08-21T14:28:02.9547686+05:30","EventType":"ProcessStop","ProcessName":"","Pid":23204,"FilePath":null,"Extra":null},
        {"Timestamp":"2025-08-21T14:28:02.9615272+05:30","EventType":"ProcessStop","ProcessName":"","Pid":20384,"FilePath":null,"Extra":null},
        {"Timestamp":"2025-08-21T14:28:02.9626032+05:30","EventType":"ProcessStop","ProcessName":"","Pid":16848,"FilePath":null,"Extra":null},
        {"Timestamp":"2025-08-21T14:28:02.9657575+05:30","EventType":"ProcessStart","ProcessName":"chrome","Pid":10664,"FilePath":null,"Extra":{"ParentPid":21836,"ImageFileName":"chrome.exe"}}
  ]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      try{
        const data = JSON.parse(event.data);
        if(Array.isArray(data)){
          setLogs(prev=>[...prev,...data.reverse()])
        }else{
          setLogs(prev=>[data,...prev])
        }
      }catch(err){  
        console.error("invalid ws message:",event.data,err)
      }
    };

    ws.onopen = () => console.log("Connected to SysWatch backend");
    ws.onclose = () => console.log("Disconnected");

    return () => ws.close();
  }, []);

  return (
    <div className="p-4 font-mono text-sm">
      <h2 className="text-lg font-bold mb-2">SysWatch Logs</h2>
      <pre className="bg-gray-900 text-green-400 p-2 rounded h-[90vh] overflow-y-scroll">
        {logs.map((log, idx) => (
          <div key={idx}>{JSON.stringify(log, null, 2)}</div>
        ))}
      </pre>
    </div>
  );
}
