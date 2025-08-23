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
// next steps  handle recieving ACK message to frontend by displaying a Toast on play and pause and other events
### handling acknowledgements on frontend
```
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
```
### implementing **clear logs** function
#### Refactoring ws.on('message')
```
if(data.type==="CONTROL"){
  if(!dotnetProcess.stdin.writable){
    console.error(".NET process stdin not writable");
    ws.send(JSON.stringify({type:"ERROR",action:data.action,message:"Process stdin not writable"}));
    return;
  }
  switch(data.action){
    case "CLEAR_LOGS":
      dotnetProcess.stdin.write("STOP\n");
      console.log("sent control:","STOP");
      // waiting 100ms for .NET to pause
      await new Promise((res)=>setTimeout(res,100));
      // clear log file
      await new Promise((resolve,reject)=>{
        fs.truncate(logFilePath,0,(err)=>{
          if(err){
            console.error("Failed to clear logs:",err);
            reject(err);
          }else{
            console.log("Logs cleared");
            resolve();
            resetTailPosition();
          }
        })
      })
      // ACK to frontend
      ws.send(JSON.stringify({type:"ACK",action:"CLEAR_LOGS"}));
      // resuming .NET after delay
      setTimeout(()=>{
        dotnetProcess.stdin.write("START\n");
        console.log("sent control:","START");
      },200);
      break;

    default:
      dotnetProcess.stdin.write(data.action+"\n");
      ws.send(JSON.stringify({type:"ACK",action:data.action}));
      console.log("sent control:",data.action)
}
```
1. using deafault switch to send message to .NET child process
2. for **CLEAR_LOGS** message 
   -  initially a STOP control is sent to child_process(.NET)
   -  awaitinng for 100ms to pause
   -  clearing the logFile synchronously using fs.truncate 
   -  forward ACK flag to frontend to clear and reset things on its side
   -  resuming the child_process after a delay (200ms) using START control
   -  also in between the **resetTailPosition()** reassigns the postion of fileRead for **tailFile()** to 0 ensuring the file is read from start again.
> Minor issue: "after file truncate the file is filled with **NUL** then followed by json data" not a issue for program flow but need __FIX__
---
found that the occurance for **NULNULNUL...** is due to .NET child process that still has the log file handle open;
- the iSSUE is with dotnet application holding the **wrong offset** so we see NULNUL and the next json are from the same last postion from where we deleted the content
- modified ListenForCommands() function which opens a new handle to log file on START and erases its refernce onSTOP
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
                logStream?.Flush();
                logStream?.Close();
                logStream = null;
                Console.WriteLine("[SysWatch] Logging paused and file handle closed.");
                break;

            case "START":
                _isPaused = false;
                string projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", ".."));
                string logsDir = Path.Combine(projectRoot, "logs");
                Directory.CreateDirectory(logsDir);
                string logFile = Path.Combine(logsDir, "SysWatch.jsonl");

                logStream = new StreamWriter(
                    new FileStream(logFile, FileMode.Append, FileAccess.Write, FileShare.ReadWrite)
                ) { AutoFlush = true };

                Console.WriteLine("[SysWatch] Logging resumed and file handle reopened.");
                break;

            case "EXIT":
                _isPaused = true;
                logStream?.Flush();
                logStream?.Close();
                logStream = null;
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
also the WriteJsonRecord is refactored to more reliable version check both the flag and streamWriter before writing
```
static void WriteJsonRecord(StreamWriter? logStream, SysEvent record)
{
    if (_isPaused || logStream == null) return; // 🚫 skip if paused or closed

    try
    {
        string json = JsonSerializer.Serialize(record);
        logStream.WriteLine(json);
        logStream.Flush(); // realtime streaming
    }
    catch (ObjectDisposedException)
    {
        // Handle rare race: logStream closed right before write
        Console.WriteLine("[SysWatch] Attempted to write while logStream was closed.");
    }
}
```
