import { useEffect, useState } from "react";

export default function LogsViewer() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onmessage = (event) => {
      const log = JSON.parse(event.data);
      console.log(event.data)
      setLogs((prev) => [...prev, log]); 
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
