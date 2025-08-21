# TAKE 2 

### next steps rewriting the c# code to write structured logs(json) to logs/ path
#### code samples
```
string projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", ".."));
string logsDir = Path.Combine(projectRoot,"logs");
Directory.CreateDirectory(logsDir);
string logFile = Path.Combine(logsDir, "SysWatch.jsonl");
string filtersFile = "filters.json"; 
```
getting logFile path and filtersFile

### filters file(json)
```
[{
  "includePaths": ["C:\\Users", "C:\\Projects"],
  "excludePaths": ["C:\\Windows", "C:\\Program Files"],
  "eventTypes": ["ProcessStart", "ProcessStop","FileIO"]
}]
```
>!!!issue no logs write for FileIO (needed fix) ... 

### loading filters file
```
static List<FilterRule> LoadFilters(string path)
{
    if (!File.Exists(path))
    {
        Console.WriteLine($"[SysWatch] No filters.json found, logging everything...");
        return new List<FilterRule>();
    }

    string json = File.ReadAllText(path);
    return JsonSerializer.Deserialize<List<FilterRule>>(json) ?? new List<FilterRule>();
}
```
### json structure class
```
class SysEvent
{
    public DateTime Timestamp { get; set; }
    public string EventType { get; set; }
    public string ProcessName { get; set; }
    public int Pid { get; set; }
    public string FilePath { get; set; }
    public Dictionary<string, object> Extra { get; set; }
}
```
### sample json write for process start
```
session.Source.Kernel.ProcessStart += data =>
{
    var record = new SysEvent
    {
        Timestamp = data.TimeStamp,
        EventType = "ProcessStart",
        ProcessName = data.ProcessName,
        Pid = data.ProcessID,
        Extra = new Dictionary<string, object>
        {
            {"ParentPid", data.ParentID},
            {"ImageFileName", data.ImageFileName}
        }
    };

    if (PassesFilters(record, filters))
    {
        WriteJsonRecord(logStream, record);
    }
};
```
### filter code
```
static bool PassesFilters(SysEvent record, List<FilterRule> filters)
{
    foreach (var filter in filters)
    {
        if (filter.EventType != null && !record.EventType.Equals(filter.EventType, StringComparison.OrdinalIgnoreCase))
            continue;

        if (filter.ProcessName != null && !record.ProcessName.Contains(filter.ProcessName, StringComparison.OrdinalIgnoreCase))
            continue;

        if (filter.FilePath != null && (record.FilePath == null || !record.FilePath.Contains(filter.FilePath, StringComparison.OrdinalIgnoreCase)))
            continue;

        return true; // passed one filter
    }
    return filters.Count == 0; // no filters = log everything
}
```
### ....  using websocket for nodejs server for realtime data log
1. setting up imports and file_path_to_**logFile**
```
import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.resolve(__dirname, "../logs/SysWatch.jsonl");
const wss = new WebSocketServer({port:8080});
console.log("WebSocket server running on ws://localhost:8080");

```
2. websocket connection and close handlers for sending **jsonLogLine** to client
```
wss.on("connection", (ws) => {
  console.log("Client connected");
  tailFile(logFilePath, (jsonLine) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(jsonLine));
      console.log(jsonLine)
    }
  });
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
```
3. tailing th **Log** file at 500ms 
- keeping track of bytes already read with **(fileSize)**
- Every 500ms (setInterval with 500ms)
  - check if the file has grown (new logs were written)
  - if yes, open the file from last known position to new end (fs.createReadStream)
  - reads only the new lines (not the whole file again)
  - split the chunk into lines, parse each line as JSON, call onLine(json) to websocket
- Update fileSize so next time it continues where it left off.
- Its like tailing a log like `tail -f` in linux
```
function tailFile(filePath, onLine) {
  let fileSize = 0;
  // Poll for changes every second
  setInterval(() => {
    fs.stat(filePath, (err, stats) => {
      if (err) return;
      if (stats.size > fileSize) {
        const stream = fs.createReadStream(filePath, {
          start: fileSize,
          end: stats.size,
          encoding: "utf8",
        });
      // console.log("stats lower: ",stats.size,"fileSize: ",fileSize)
        stream.on("data", (chunk) => {
          const lines = chunk.trim().split("\n");
          for (const line of lines) {
            if (line.trim()) {
              try {
                const json = JSON.parse(line);
                onLine(json);
              } catch (e) {
                console.error("Failed to parse line:", line);
              }
            }
          }
        });
        fileSize = stats.size;
      }
    });
  }, 500);
}
```