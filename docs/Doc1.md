# TAKE 1
> Initially 1. we are logging process start, stop and FileIOInit as
```
using System;
using System.IO;
using Microsoft.Diagnostics.Tracing;
using Microsoft.Diagnostics.Tracing.Parsers;
using Microsoft.Diagnostics.Tracing.Parsers.Kernel;
using Microsoft.Diagnostics.Tracing.Session;
class Doc1
{
    static void Main()
    {
        if (!(TraceEventSession.IsElevated() ?? false))
        {
            Console.WriteLine("Please run as Administrator.");
            return;
        }
        string logPath = "../logs/SysWatchProcessLogs.log";
        using StreamWriter logFile = new StreamWriter(logPath, append: true);
        using (var session = new TraceEventSession("SysWatchSession"))
        {
            Console.CancelKeyPress += (s, e) => session.Dispose();
            session.EnableKernelProvider(
                KernelTraceEventParser.Keywords.Process 
                // KernelTraceEventParser.Keywords.FileIOInit
            );
            // session.EnableKernelProvider((KernelTraceEventParser.Keywords)(0x10 | 0x40)); // Process + FileIO
            session.Source.Kernel.ProcessStart += (proc) =>
            {
                string msg = $"[+] Process Started: {proc.ProcessName} (PID: {proc.ProcessID})";
                Console.WriteLine(msg);
                logFile.WriteLine(msg);
            };
            session.Source.Kernel.ProcessStop += (proc) =>
            {
                string msg = $"[-] Process Exited: {proc.ProcessName} (PID: {proc.ProcessID})";
                Console.WriteLine(msg);
                logFile.WriteLine(msg);
            };
            session.Source.Kernel.FileIOCreate += (file) =>
            {
                string msg = $"[FileIO] {file.ProcessName} -> {file.FileName}";
                Console.WriteLine(msg);
                logFile.WriteLine(msg);
            };
            Console.WriteLine("Logging to SysWatch.log ... Press Ctrl+C to stop.");
            session.Source.Process(); // blocks here
        }
    }
}
```
```[-] Process Exited:  (PID: 22776)
[+] Process Started: chrome (PID: 24060)
[+] Process Started: dotnet (PID: 20628)
[+] Process Started: dotnet (PID: 16060)
[+] Process Started: dotnet (PID: 20996)
[+] Process Started: dotnet (PID: 5956)
indicating process start with [+] and stop with [-]
```
```
[FileIO] System -> C:\WINDOWS\system32\Logfiles\WMI\RtBackup\EtwRTSysWatchSession.etl
[FileIO]  -> E:\SysWatchETW
[FileIO] SysWatchETW -> C:\Program Files\dotnet\shared\Microsoft.NETCore.App\8.0.18\ole32.dll
[FileIO] SysWatchETW -> C:\Program Files\dotnet\shared\Microsoft.NETCore.App\8.0.18\ole32.dll
[FileIO] SysWatchETW -> C:\Program Files\dotnet\shared\Microsoft.NETCore.App\8.0.18\System.Text.Encoding.Extensions.dll
[FileIO] SysWatchETW -> C:\Program Files\dotnet\shared\Microsoft.NETCore.App\8.0.18\System.Text.Encoding.Extensions.dll
[FileIO] SysWatchETW -> C:\Program Files\dotnet\shared\Microsoft.NETCore.App\8.0.18\System.Text.Encoding.Extensions.dll
```
> ISSUE some process stops (almost every) has no names and data is unstructured for the node js backend to parse and send to frontend
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

**That will probably cut our log size by 90%+ while still keeping the interesting stuff.**