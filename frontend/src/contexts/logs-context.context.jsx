import { createContext, useMemo, useState,useEffect,useContext, useRef } from "react";
import { toast } from "sonner";

const LogsContext = createContext();
export const LogsProvider =({children})=>{
    const [logs,setLogs]=useState([]);
    const [filterType,setFilterType]=useState("All Logs");
    const [searchQuery,setSearchQuery]=useState("");
    //stats
    const [totalEvents, setTotalEvents] = useState(0);
    const [processStartCount, setProcessStartCount] = useState(0);
    const [processStopCount, setProcessStopCount] = useState(0);
    const [activePids, setActivePids] = useState(new Set());
    // websocket in a ref to use across components
    const wsRef = useRef(null);
    // filtering logic
    const filteredLogs = useMemo(()=>{
      let result = logs;
        if(filterType==="Process Start"){
          result= result.filter((log)=>log.EventType==="ProcessStart");
        } 
        else if(filterType==="Process Stop"){
          result = result.filter((log)=>log.EventType==="ProcessStop");
        }
        if(searchQuery.trim() !== ""){
          result = result.filter((log)=>
            log?.ProcessName?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        }
        return result;
    },[logs,filterType,searchQuery])
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
              setLogs([]);
              setTotalEvents(0);
              setProcessStartCount(0);
              setProcessStopCount(0);
              setActivePids(new Set());
              toast.success("Logs cleared successfully!");
            }else{
              toast.success(`Action "${data.action}" executed successfully!`);
            }
            return;
          }
        const handleLog = (log) => {
          setLogs((prev) => [log, ...prev]);
          setTotalEvents((prev) => prev + 1);

          if (log.EventType === "ProcessStart") {
            setProcessStartCount((prev) => prev + 1);
            setActivePids((prev) => {
              const copy = new Set(prev);
              copy.add(log.Pid);
              return copy;
            });
          } else if (log.EventType === "ProcessStop") {
            setProcessStopCount((prev) => prev + 1);
            setActivePids((prev) => {
              const copy = new Set(prev);
              copy.delete(log.Pid);
              return copy;
            });
          }
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

  const handleSetFilterType=(val)=>setFilterType(val)
  const handleSetSearchQuery=(val)=>setSearchQuery(val);
   const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    };
    return(
        <LogsContext.Provider value={{filterType,handleSetFilterType,filteredLogs,totalEvents,processStartCount,processStopCount,activePids,searchQuery,handleSetSearchQuery,sendControlCommand,formatTime}}>
            {children}
        </LogsContext.Provider>
    )
}
export const useLogsContext = ()=>useContext(LogsContext);