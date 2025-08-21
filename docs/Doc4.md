# TAKE 4
**Important take that facilitated architecture similar to IPC(Inter Process Communication)**

### frontend modifications
introduction if global context (logs-context) which handles 
```
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
```
1. maintains logs, filterType(processStart,stop and all logs),searchQuery
2. maintains stats totalevents, processStartCount, stopCount and active process count;
3. websocket connection also exposes controlCommand function for **ExternalProcessControl**

### backend changes
spawn to run dotnet application as child_process and logs its state
```
import { spawn } from "child_process";
const dotnetProcess=spawn("dotnet",["run"],{
  cwd:path.resolve(__dirname,"../SysWatchETW"),
  stdio:["pipe","pipe","pipe"]
})

dotnetProcess.stdout.on("data",(data)=>{
  console.log(`[SysWatch]: ${data.toString().trim()}`)
})

dotnetProcess.stderr.on("data", (data) => {
  console.error(`[SysWatch ERROR]: ${data.toString().trim()}`);
});

dotnetProcess.on("exit", (code) => {
  console.log(`[SysWatch] exited with code ${code}`);
});
```
Modified tailFile function for 
1. dont constantly reopen streams
2. JSON lines wont get split across chunks
3. file is tailed more robustly

```
function tailFile(filePath, onLine) {
  let buffer = "";
  let position = 0;
  setInterval(async () => {
    try {
      const stats = await fs.promises.stat(filePath);
      if (stats.size > position) {
        const fd = await fs.promises.open(filePath, "r");
        const { bytesRead, buffer: chunk } = await fd.read({
          buffer: Buffer.alloc(stats.size - position),
          position,
        });
        fd.close();
        position += bytesRead;
        buffer += chunk.toString("utf8");
        let lines = buffer.split("\n");
        buffer = lines.pop() || ""; // keep partial line
        for (const line of lines) {
          if (line.trim()) {
            try {
              onLine(JSON.parse(line));
            } catch (e) {
              console.error("Failed to parse line:", line);
            }
          }
        }
      }
    } catch (err) {
      console.log("file might not exist yet",err);
    }
  }, 500);
}
```
Handling frontend messages and relaying them to dotnetProcess using standardWrite channel
```
ws.on('message',(msg)=>{
    try{
      const str = msg.toString().trim();
      const data = JSON.parse(str);
      if(data.type==="CONTROL"){
        if(dotnetProcess.stdin.writable){
          dotnetProcess.stdin.write(data.action+"\n");
          ws.send(JSON.stringify({type:"ACK",action:data.action}));
          console.log("sent control:",data.action)
        }else{
          console.error(".NET process stdin not writable")
        }
      }
    }catch(e){
      console.error("invalid message",msg.toString(),e.message);
    }
  })
```
shutdown funtion to terminate(kill) child process
```
// graceful shutdown handler to dotnet process
function shutdown(){
  console.log("Shutting down backend..");
  if(dotnetProcess && dotnetProcess.stdin.writable){
    console.log("Sending EXIT to SysWatch..");
    dotnetProcess.stdin.write("EXIT\n");
  }
  // giving syswatch a chance to clean up before force killing
  setTimeout(()=>{
    if(!dotnetProcess.killed){
      console.log("Force killing SysWatch process..");
      dotnetProcess.kill("SIGKILL");
    }
    process.exit(0);
  },2000)
}
process.on("SIGINT",shutdown);
process.on("SIGTERM",shutdown);
process.on("exit",shutdown);
```

### ETW(dotnet application) changes
admin checks privelage check and Task thread to listen for messages...
```
static bool _isPaused = false; // control flag
static StreamWriter? logStream;
```
control flag and streamWriter
```
//ensuring stdout uses UTF-8 and flushes immediately
Console.OutputEncoding = System.Text.Encoding.UTF8;
Console.WriteLine("[SysWatch] Initialized");
Console.Out.Flush();
//admin check
if (!(TraceEventSession.IsElevated() ?? false))
{
   Console.WriteLine("[SysWatch ERROR]: Please run as Administrator.");
}
   // run stdin listener in background
   Task.Run(() => ListenForComands());
```

`logStream = new StreamWriter(new FileStream(logFile, FileMode.Append, FileAccess.Write, FileShare.ReadWrite)) { AutoFlush = true };`
streamWriter to allow FileShare for backend to read file
>if (_isPaused) return;
flag to ensure the log is not written to file at all events

Function which handles messages from nodejs backend 
```
static void ListenForComands()
 {
     while (true)
     {
         var line = Console.ReadLine();
         if (line == null) continue;
         switch (line.Trim().ToUpperInvariant())
         {
             case "STOP":
                 _isPaused = true;
                 Console.WriteLine("[SysWatch] Logging paused.");
                 break;
             case "START":
                 _isPaused = false;
                 Console.WriteLine("[SysWatch] Logging resumed.");
                 break;
             case "EXIT":
                 _isPaused = true;
                 Console.WriteLine("[SysWatch] Exiting on request.");
                 Environment.Exit(0);
                 break;
             default:
                 Console.WriteLine($"[SysWatch] Unknown command: {line}");
                 break;
         }
     }
 }
```
// next steps (optional) handle recieving ACK message to frontend by displaying a Toast on play and pause