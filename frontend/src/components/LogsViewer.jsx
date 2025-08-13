import { useEffect, useState } from "react";

const LogsViewer = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // const fetchLogs = () => {
    //   fetch('http://localhost:3001/api/logs')
    //     .then(res => res.json())
    //     .then(setLogs)
    //     .catch(err => console.error('fetch failed: ', err));
    // };
    // fetchLogs();
    // const interval = setInterval(fetchLogs, 3000);
    // return () => clearInterval(interval);
  }, []);

  const getColor = (event) => {
    switch (event) {
      case "ProcessStart": return "text-green-500";
      case "ProcessStop": return "text-red-500";
      case "FileIO": return "text-blue-500";
      default: return "";
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white h-screen overflow-y-auto font-mono">
      {logs.map((log, idx) => (
        <div key={idx} className={`mb-1 ${getColor(log.event)}`}>
          [{log.timestamp}] {log.event} → {log.details}
        </div>
      ))}
    </div>
  );
};

export default LogsViewer;
