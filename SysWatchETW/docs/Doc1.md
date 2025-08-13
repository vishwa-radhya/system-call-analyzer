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
> ISSUE some process stop (almost every) has no names and data is unstructures for the node js backend to parse and send to frontend