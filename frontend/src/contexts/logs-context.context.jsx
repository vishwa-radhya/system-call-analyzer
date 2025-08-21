import { createContext, useMemo, useState,useEffect,useContext } from "react";

const LogsContext = createContext();
export const LogsProvider =({children})=>{
    const [logs,setLogs]=useState([
      {"Timestamp":"2025-08-19T16:43:37.3230197+05:30","EventType":"ProcessStop","ProcessName":"","Pid":7592,"FilePath":null,"Extra":null},
    {"Timestamp":"2025-08-21T14:28:02.9019034+05:30","EventType":"ProcessStart","ProcessName":"chrome","Pid":16848,"FilePath":null,"Extra":{"ParentPid":21836,"ImageFileName":"chrome.exe"}},
    {"Timestamp":"2025-08-21T14:28:02.9440511+05:30","EventType":"ProcessStop","ProcessName":"","Pid":22408,"FilePath":null,"Extra":null},
    {"Timestamp":"2025-08-21T14:28:02.9547686+05:30","EventType":"ProcessStop","ProcessName":"","Pid":23204,"FilePath":null,"Extra":null},
    {"Timestamp":"2025-08-21T14:28:02.9615272+05:30","EventType":"ProcessStop","ProcessName":"","Pid":20384,"FilePath":null,"Extra":null},
    {"Timestamp":"2025-08-21T14:28:02.9626032+05:30","EventType":"ProcessStop","ProcessName":"","Pid":16848,"FilePath":null,"Extra":null},
    {"Timestamp":"2025-08-21T14:28:02.9657575+05:30","EventType":"ProcessStart","ProcessName":"chrome","Pid":10664,"FilePath":null,"Extra":{"ParentPid":21836,"ImageFileName":"chrome.exe"}}
    ]);
    const [filterType,setFilterType]=useState("All Logs");
    const [searchQuery,setSearchQuery]=useState("");
    //stats
    const [totalEvents, setTotalEvents] = useState(0);
    const [processStartCount, setProcessStartCount] = useState(0);
    const [processStopCount, setProcessStopCount] = useState(0);
    const [activePids, setActivePids] = useState(new Set());
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
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
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
  const handleSetFilterType=(val)=>setFilterType(val)
  const handleSetSearchQuery=(val)=>setSearchQuery(val);
    return(
        <LogsContext.Provider value={{filterType,handleSetFilterType,filteredLogs,totalEvents,processStartCount,processStopCount,activePids,searchQuery,handleSetSearchQuery}}>
            {children}
        </LogsContext.Provider>
    )
}
export const useLogsContext = ()=>useContext(LogsContext);