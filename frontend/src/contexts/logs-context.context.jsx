import { createContext, useMemo, useState,useEffect,useContext, useRef } from "react";
import { toast } from "sonner";

const LogsContext = createContext();
export const LogsProvider =({children})=>{
    // shared or global data
    const [isPaused,setIsPaused]=useState(false);
    const [eventCounts,setEventCounts]=useState({});

    // process Data
    const [processLogs,setProcessLogs]=useState([
     {"Timestamp":"2025-10-08T12:41:05.887Z","EventType":"ProcessStop","ProcessName":"RuntimeBroker","Pid":12188,"FilePath":null,"Extra":null},
{"Timestamp":"2025-10-08T12:41:05.887Z","EventType":"ProcessStop","ProcessName":"dllhost","Pid":18036,"FilePath":null,"Extra":null},
{"Timestamp":"2025-10-08T12:41:05.887Z","EventType":"ProcessStop","ProcessName":"dllhost","Pid":18036,"FilePath":null,"Extra":null},
{"Timestamp":"2025-10-08T12:41:05.887Z","EventType":"ProcessStop","ProcessName":"dllhost","Pid":18036,"FilePath":null,"Extra":null},
{"Timestamp":"2025-10-08T12:41:05.887Z","EventType":"ProcessStop","ProcessName":"dllhost","Pid":18036,"FilePath":null,"Extra":null},
{"Timestamp":"2025-10-08T12:41:05.887Z","EventType":"ProcessStop","ProcessName":"dllhost","Pid":18036,"FilePath":null,"Extra":null},
    ]);
    const [processFilterType,setProcessFilterType]=useState("All Logs");
    const [processSearchQuery,setProcessSearchQuery]=useState("");
    const [activePids, setActivePids] = useState(new Set());

    //FileIO data
    const [fileIOLogs,setFileIOLogs]=useState([
      {"Timestamp":"2025-10-08T12:41:05.887Z","EventType":"FileRename","ProcessName":"explorer","Pid":21976,"FilePath":"C:\\Users\\vishu\\testWatch\\ff.txt","Extra":null},
      {"Timestamp":"2025-10-08T12:41:05.887Z","EventType":"FileRename","ProcessName":"explorer","Pid":21976,"FilePath":"C:\\Users\\vishu\\testWatch\\ff.txt","Extra":null},
      {"Timestamp":"2025-10-08T12:41:05.887Z","EventType":"FileRename","ProcessName":"explorer","Pid":21976,"FilePath":"C:\\Users\\vishu\\testWatch\\ff.txt","Extra":null},

    ]);
    const [fileIOFilterType,setFileIOFilterType]=useState("All Logs");
    const [fileIOSearchQuery,setFileIOSearchQuery]=useState("");

    // Network data
    const [networkLogs,setNetworkLogs]=useState([
       {"Timestamp":"2025-10-08T12:41:05.887Z","EventType":"NetworkDisconnect","ProcessName":"helper","Pid":2692,"FilePath":null,"Extra":{"Operation":"Disconnect","Protocol":"TCP","LocalAddress":"10.2.25.106","LocalPort":14350,"RemoteAddress":"52.23.19.168","RemotePort":443}},

    ]);
    const [networkFilterType,setNetworkFilterType]=useState("All Logs");
    const [networkSearchQuery,setNetworkSearchQuery]=useState("");
    
    // anomaly data
    const [anomalyData,setAnomalyData]=useState([]);
    const [anomalyFilterType,setAnomalyFilterType] = useState("All Logs");
    const [anomalySearchQuery,setAnomalySearchQuery]=useState("");

    // websocket in a ref to use across 
    const wsRef = useRef(null);
    // filtering logic
    const filteredAnomalies = useMemo(()=>{
      let result = anomalyData;
      if(anomalyFilterType==="low"){
        result = result.filter((log)=>log.Severity==="low")
      }else if(anomalyFilterType==="medium"){
        result=result.filter((log)=>log.Severity==="medium")
      }else if(anomalyFilterType==="high"){
        result = result.filter((log)=>log.Severity==="high")
      }
      if(anomalyFilterType.trim() !== ""){
        result = result.filter((log)=>log?.Rule?.toLowerCase().includes(anomalySearchQuery.toLowerCase()))
      }
      return result;
    },[anomalyData,anomalyFilterType,anomalySearchQuery])

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

    const filteredNetworkLogs=useMemo(()=>{
      let result = networkLogs;
      if(networkFilterType==="Network Connect"){
        result = result.filter((log)=>log.EventType==="NetworkConnect");
      }else if(networkFilterType==="Network Disconnect"){
        result = result.filter((log)=>log.EventType==="NetworkDisconnect");
      }
      if(networkFilterType.trim() !== ""){
        result = result.filter((log)=>log?.ProcessName?.toLowerCase().includes(networkSearchQuery.toLowerCase()))
      }
      return result;
    },[networkLogs,networkFilterType,networkSearchQuery])

    // websocket useEffect
    useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current=ws;
    ws.onmessage = (event) => {
      try {
        const logData = JSON.parse(event.data);
        if(logData.type === "ERROR"){
          toast.error(`Action ${logData.action} failed: ${logData.message}`);
          return;
        }
        if (logData.type === "ACK") {
            if(logData.action==="CLEAR_LOGS"){
              setProcessLogs([]);
              setEventCounts({});
              setActivePids(new Set());
              setFileIOLogs([]);
              setNetworkLogs([]);
              toast.success("Logs cleared successfully!");
            }else{
              if(logData.action==="STOP"){
                handleSetIsPaused(true)
              }else if(logData.action === "START"){
                handleSetIsPaused(false)
              }
              toast.success(`Action "${logData.action}" executed successfully!`);
            }
            return;
          }
        const handleLog = (log,type) => {
          if(type === "log"){
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
          if(log.EventType==="NetworkConnect" || log.EventType==="NetworkDisconnect"){
            setNetworkLogs((prev)=>[log,...prev]);
          }
          setEventCounts((prev)=>({
            ...prev,
            [log.EventType] : (prev[log.EventType] || 0) + 1
          }))
        }else if(type === "anomaly"){
          setAnomalyData((prev)=>[log,...prev]);
        }
        };

        if (Array.isArray(logData)) {
          logData.reverse().forEach(item=>handleLog(item.data,item.type));
        } else {
          handleLog(logData.data,logData.type);
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
  const handleSetNetworkFilterType=(val)=>{
    setNetworkFilterType(val);
  }
  const handleSetNetworkSearchQuery=(val)=>{
    setNetworkSearchQuery(val);
  }
  const handleSetAnomalyFilterType=(val)=>{
    setAnomalyFilterType(val);
  } 
  const handleSetAnomalySearchQuery=(val)=>{
    setAnomalySearchQuery(val);
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
          filteredNetworkLogs,
          networkFilterType,
          handleSetNetworkFilterType,
          networkSearchQuery,
          handleSetNetworkSearchQuery,
          filteredAnomalies,
          anomalyFilterType,
          handleSetAnomalyFilterType,
          anomalySearchQuery,
          handleSetAnomalySearchQuery,
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