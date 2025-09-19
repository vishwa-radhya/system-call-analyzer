import { createContext, useMemo, useState,useEffect,useContext, useRef } from "react";
import { toast } from "sonner";

const LogsContext = createContext();
export const LogsProvider =({children})=>{
    // shared or global data
    const [isPaused,setIsPaused]=useState(false);
    const [eventCounts,setEventCounts]=useState({});

    // process Data
    const [processLogs,setProcessLogs]=useState([]);
    const [processFilterType,setProcessFilterType]=useState("All Logs");
    const [processSearchQuery,setProcessSearchQuery]=useState("");
    const [activePids, setActivePids] = useState(new Set());

    //FileIO data
    const [fileIOLogs,setFileIOLogs]=useState([]);
    const [fileIOFilterType,setFileIOFilterType]=useState("All Logs");
    const [fileIOSearchQuery,setFileIOSearchQuery]=useState("");

    
    // websocket in a ref to use across components
    const wsRef = useRef(null);
    // filtering logic
    const filteredProcessLogs = useMemo(()=>{
      let result = processLogs;
        if(processFilterType==="Process Start"){
          result= result.filter((log)=>log.EventType==="ProcessStart");
        } 
        else if(processFilterType==="Process Stop"){
          result = result.filter((log)=>log.EventType==="ProcessStop");
        }
        if(processFilterType.trim() !== ""){
          result = result.filter((log)=>
            log?.ProcessName?.toLowerCase().includes(processSearchQuery.toLowerCase())
          )
        }
        return result;
    },[processLogs,processFilterType,processSearchQuery])

    const filteredFileIOLogs=useMemo(()=>{
      let result =fileIOLogs;
      if(fileIOFilterType==="File Read"){
        result = result.filter((log)=>log.EventType==="FileRead");
      }else if(fileIOFilterType === "File Write"){
        result = result.filter((log)=>log.EventType==="FileWrite");
      }else if(fileIOFilterType==="File Rename"){
        result = result.filter((log)=>log.EventType==="FileRename");
      }
      if(fileIOFilterType.trim() !== ""){
          result = result.filter((log)=>log?.ProcessName?.toLowerCase().includes(fileIOSearchQuery.toLowerCase())
        )
      }
      return result;
    },[fileIOLogs,fileIOFilterType,fileIOSearchQuery])

    // websocket useEffect
    useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current=ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if(data.type === "ERROR"){
          toast.error(`Action ${data.action} failed: ${data.message}`);
          return;
        }
        if (data.type === "ACK") {
            if(data.action==="CLEAR_LOGS"){
              setProcessLogs([]);
              setEventCounts({});
              setActivePids(new Set());
              toast.success("Logs cleared successfully!");
            }else{
              if(data.action==="STOP"){
                handleSetIsPaused(true)
              }else if(data.action === "START"){
                handleSetIsPaused(false)
              }
              toast.success(`Action "${data.action}" executed successfully!`);
            }
            return;
          }
        const handleLog = (log) => {
          if(log.EventType==="ProcessStart" || log.EventType==="ProcessStop"){
            setProcessLogs((prev)=>[log,...prev]);
            if (log.EventType === "ProcessStart") {
              setActivePids((prev) => {
                const copy = new Set(prev);
                copy.add(log.Pid);
                return copy;
              });
            } 
            else if (log.EventType === "ProcessStop") {
              setActivePids((prev) => {
                const copy = new Set(prev);
                copy.delete(log.Pid);
                return copy;
              });
            }
          }
          if(log.EventType==="FileRead" || log.EventType==="FileWrite" || log.EventType==="FileRename"){
            setFileIOLogs((prev)=>[log,...prev])
          }
          setEventCounts((prev)=>({
            ...prev,
            [log.EventType] : (prev[log.EventType] || 0) + 1
          }))
        };

        if (Array.isArray(data)) {
          data.reverse().forEach(handleLog);
        } else {
          handleLog(data);
        }
      } catch (err) {
        console.error("invalid ws message:", event.data, err);
      }
    };

    ws.onopen = () => console.log("Connected to SysWatch backend");
    ws.onclose = () => console.log("Disconnected");
    return () => ws.close();
  }, []);

  const sendControlCommand=(command)=>{
    if(wsRef.current && wsRef.current.readyState===WebSocket.OPEN){
      wsRef.current.send(JSON.stringify({type:"CONTROL",action:command}));
    }else{
      console.warn("WebSocket not connected, cannot send command");
    }
  }

  const handleSetProcessFilterType=(val)=>{
    setProcessFilterType(val)
  }
  const handleSetProcessSearchQuery=(val)=>{
    setProcessSearchQuery(val);
  }
  const handleSetFileIOFilterType=(val)=>{
    setFileIOFilterType(val);
  }
  const handleSetFileIOSearchQuery=(val)=>{
    setFileIOSearchQuery(val);
  }
  const handleSetIsPaused=(bool)=>setIsPaused(bool)
   const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    };
    return(
        <LogsContext.Provider value={{
          filteredProcessLogs,
          processFilterType,
          handleSetProcessFilterType,
          processSearchQuery,
          handleSetProcessSearchQuery,
          activePids,
          eventCounts,
          filteredFileIOLogs,
          fileIOFilterType,
          handleSetFileIOFilterType,
          fileIOSearchQuery,
          handleSetFileIOSearchQuery,
          sendControlCommand,
          formatTime,
          handleSetIsPaused,
          isPaused
          }}>
            {children}
        </LogsContext.Provider>
    )
}
export const useLogsContext = ()=>useContext(LogsContext);