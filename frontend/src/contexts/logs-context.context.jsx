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
      {"Timestamp":"2025-10-08T16:52:22.8732157+05:30","EventType":"FileRename","ProcessName":"explorer","Pid":21976,"FilePath":"C:\\Users\\vishu\\testWatch\\ff.txt","Extra":null},
{"Timestamp":"2025-10-08T16:52:22.9015171+05:30","EventType":"FileRead","ProcessName":"SearchProtocolHost","Pid":6556,"FilePath":"C:\\Users\\vishu\\testWatch\\frr.txt","Extra":null},
{"Timestamp":"2025-10-08T16:52:23.0150887+05:30","EventType":"FileRead","ProcessName":"SearchProtocolHost","Pid":6556,"FilePath":"C:\\Users\\vishu\\testWatch\\frr.txt","Extra":null},
{"Timestamp":"2025-10-08T16:52:23.0372435+05:30","EventType":"FileRead","ProcessName":"SearchProtocolHost","Pid":6556,"FilePath":"C:\\Users\\vishu\\testWatch\\frr.txt","Extra":null}
    ]);
    const [fileIOFilterType,setFileIOFilterType]=useState("All Logs");
    const [fileIOSearchQuery,setFileIOSearchQuery]=useState("");

    // Network data
    const [networkLogs,setNetworkLogs]=useState([
       {"Timestamp":"2025-10-08T16:51:32.5732536+05:30","EventType":"NetworkDisconnect","ProcessName":"helper","Pid":2692,"FilePath":null,"Extra":{"Operation":"Disconnect","Protocol":"TCP","LocalAddress":"10.2.25.106","LocalPort":14350,"RemoteAddress":"52.23.19.168","RemotePort":443}},
{"Timestamp":"2025-10-08T16:51:34.7692535+05:30","EventType":"NetworkDisconnect","ProcessName":"chrome","Pid":10708,"FilePath":null,"Extra":{"Operation":"Disconnect","Protocol":"TCP","LocalAddress":"127.0.0.1","LocalPort":35479,"RemoteAddress":"127.0.0.1","RemotePort":9229}},
{"Timestamp":"2025-10-08T16:51:34.9401331+05:30","EventType":"NetworkConnect","ProcessName":"svchost","Pid":2512,"FilePath":null,"Extra":{"Operation":"Connect","Protocol":"TCP","LocalAddress":"10.2.25.106","LocalPort":61115,"RemoteAddress":"23.211.60.150","RemotePort":80}},
{"Timestamp":"2025-10-08T16:51:34.9678058+05:30","EventType":"NetworkDisconnect","ProcessName":"svchost","Pid":2512,"FilePath":null,"Extra":{"Operation":"Disconnect","Protocol":"TCP","LocalAddress":"10.2.25.106","LocalPort":61115,"RemoteAddress":"23.211.60.150","RemotePort":80}},
{"Timestamp":"2025-10-08T16:51:37.8985691+05:30","EventType":"NetworkConnect","ProcessName":"helper","Pid":2692,"FilePath":null,"Extra":{"Operation":"Connect","Protocol":"TCP","LocalAddress":"10.2.25.106","LocalPort":35065,"RemoteAddress":"3.217.19.244","RemotePort":443}},
{"Timestamp":"2025-10-08T16:51:38.4111382+05:30","EventType":"NetworkDisconnect","ProcessName":"helper","Pid":2692,"FilePath":null,"Extra":{"Operation":"Disconnect","Protocol":"TCP","LocalAddress":"10.2.25.106","LocalPort":35065,"RemoteAddress":"3.217.19.244","RemotePort":443}},
{"Timestamp":"2025-10-08T16:51:38.8390383+05:30","EventType":"NetworkDisconnect","ProcessName":"chrome","Pid":10708,"FilePath":null,"Extra":{"Operation":"Disconnect","Protocol":"TCP","LocalAddress":"127.0.0.1","LocalPort":35064,"RemoteAddress":"127.0.0.1","RemotePort":9229}}
    ]);
    const [networkFilterType,setNetworkFilterType]=useState("All Logs");
    const [networkSearchQuery,setNetworkSearchQuery]=useState("");
    
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
              setFileIOLogs([]);
              setNetworkLogs([]);
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
          if(log.EventType==="NetworkConnect" || log.EventType==="NetworkDisconnect"){
            setNetworkLogs((prev)=>[log,...prev]);
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
  const handleSetNetworkFilterType=(val)=>{
    setNetworkFilterType(val);
  }
  const handleSetNetworkSearchQuery=(val)=>{
    setNetworkSearchQuery(val);
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