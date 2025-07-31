using System;
using System.IO;
using Microsoft.Diagnostics.Tracing;
using Microsoft.Diagnostics.Tracing.Parsers;
using Microsoft.Diagnostics.Tracing.Parsers.Kernel;
using Microsoft.Diagnostics.Tracing.Session;


class Program
{
    static void Main()
    {
        if (!(TraceEventSession.IsElevated() ?? false))
        {
            Console.WriteLine("Please run as Administrator.");
            return;
        }

        string logPath = "SysWatchProcessLogs.log";
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
