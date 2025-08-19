# TAKE 2 
> using a Map Dictionary to to ensure the process exit contains a name
 `var pidMap = new Dictionary<int, string>();`

also the structural log is written to log file
```
void WriteLog(string type, string message)
{
    string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
    string logEntry = $"[{timestamp}] [{type}] {message}";
    Console.WriteLine(logEntry);
    logFile.WriteLine(logEntry);
    logFile.Flush();
}
```
with process start is stored in map for exit process lookup
```
session.Source.Kernel.ProcessStart += (proc) =>
{
    pidMap[proc.ProcessID] = proc.ProcessName;
    WriteLog("ProcessStart", $"{proc.ProcessName} (PID: {proc.ProcessID})");
};
{
string name = string.IsNullOrEmpty(proc.ProcessName) && pidMap.ContainsKey(proc.ProcessID)
    ? pidMap[proc.ProcessID]
    : proc.ProcessName;

WriteLog("ProcessStop", $"{name} (PID: {proc.ProcessID})");
pidMap.Remove(proc.ProcessID); // removal for maintaining consistent dictionary map
};
```
> also DUE to high volume of FIleIO initially switched to D: and E: for my pc to ensure everthing is working
```
session.Source.Kernel.FileIOCreate += (file) =>
{
    if (!string.IsNullOrEmpty(file.FileName) &&
        (file.FileName.StartsWith(@"D:\", StringComparison.OrdinalIgnoreCase) ||
            file.FileName.StartsWith(@"E:\", StringComparison.OrdinalIgnoreCase)))
    {
        WriteLog("FileIO", $"{file.ProcessName} -> {file.FileName}");
    }
};
```
now using a predefined monitored paths txt file to include only necessary  paths to remove unnecessary noise

./monitored_path.txt
- D:\
- E:\
- C:\Users
- C:\Program Files
- C:\Program Files (x86)
- C:\Windows\System32

> this file is stored in /bin/Debug/net8.0/ for visibilty when `dot run` is executed

Still there is much noise like 3000+ logs in 40sec or some
### Thoughts
- those paths are very “chatty” because Windows and background services are constantly touching files in them.
- C:\Windows\System32 → OS processes, DLL loading, background updates, antivirus scans.
- C:\Program Files / (x86) → services running from installed software, background auto-updaters.
- C:\Users → browser caches, app data writes, temp files, cloud sync clients.
- ETW File I/O events are extremely high-volume in those directories, even if you’re doing nothing — Windows constantly logs activity there.

#### suggestions
-  can’t realistically log everything here without filtering — 3000+ events in 40 seconds is normal.
-  Filtering ideas:
    - Only log processes we care about (e.g., your suspicious target process).
   - Only log specific file extensions (e.g., .exe, .dll, .sys).
   - Ignore read-only operations, log only writes/deletes/renames.
   - Exclude well-known noisy processes (svchost.exe, chrome.exe, etc.).
- Aggregation:
    - Instead of logging every event, group them into summaries like:
svchost.exe wrote 15 files to C:\Windows\System32 in 10 seconds
- Burst capture mode:
    - Enable full-detail logging only when a suspicious process or path is detected.
  
This way, baseline noise is skipped.
> Following these practices
 - Reads your monitored_paths.txt
 - Ignores a predefined noisy process list
 - Only logs Write/Delete events, not every read.

**That will probably cut your log size by 90%+ while still keeping the interesting stuff.**