using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Diagnostics.Tracing;
using Microsoft.Diagnostics.Tracing.Parsers;
using Microsoft.Diagnostics.Tracing.Parsers.Kernel;
using Microsoft.Diagnostics.Tracing.Session;

class ProgramWatch
{
    static List<string> monitoredPaths = new List<string>();

    static void Main()
    {
        if (!(TraceEventSession.IsElevated() ?? false))
        {
            Console.WriteLine("Please run as Administrator.");
            return;
        }

        LoadMonitoredPaths();

        string logPath = "../logs/SysWatchProcessLogs.log";
        using StreamWriter logFile = new StreamWriter(logPath, append: true);

        using (var session = new TraceEventSession("SysWatchSession"))
        {
            Console.CancelKeyPress += (s, e) => session.Dispose();

            session.EnableKernelProvider(
                KernelTraceEventParser.Keywords.Process |
                KernelTraceEventParser.Keywords.FileIOInit
            );

            var pidMap = new Dictionary<int, string>();

            void WriteLog(string type, string message)
            {
                string timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                string logEntry = $"[{timestamp}] [{type}] {message}";
                Console.WriteLine(logEntry);
                logFile.WriteLine(logEntry);
                logFile.Flush();
            }

            session.Source.Kernel.ProcessStart += (proc) =>
            {
                pidMap[proc.ProcessID] = proc.ProcessName;
                WriteLog("ProcessStart", $"{proc.ProcessName} (PID: {proc.ProcessID})");
            };

            session.Source.Kernel.ProcessStop += (proc) =>
            {
                string name = string.IsNullOrEmpty(proc.ProcessName) && pidMap.ContainsKey(proc.ProcessID)
                    ? pidMap[proc.ProcessID]
                    : proc.ProcessName;

                WriteLog("ProcessStop", $"{name} (PID: {proc.ProcessID})");
                pidMap.Remove(proc.ProcessID);
            };

            session.Source.Kernel.FileIOCreate += (file) =>
            {
                string filePath = file.FileName;
                if (string.IsNullOrEmpty(filePath)) return;

                if (monitoredPaths.Any(path => filePath.StartsWith(path, StringComparison.OrdinalIgnoreCase)))
                {
                    WriteLog("FileIO", $"{file.ProcessName} (PID: {file.ProcessID}) -> {filePath}");
                }
            };

            Console.WriteLine("SysWatch logging started... Press Ctrl+C to stop.");
            session.Source.Process();
        }
    }

    static void LoadMonitoredPaths()
    {
        string configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "monitored_paths.txt");

        if (File.Exists(configPath))
        {
            monitoredPaths = File.ReadAllLines(configPath)
                .Where(line => !string.IsNullOrWhiteSpace(line) && !line.TrimStart().StartsWith("#"))
                .Select(line => line.Trim())
                .ToList();

            Console.WriteLine($"[INFO] Loaded {monitoredPaths.Count} monitored paths.");
        }
        else
        {
            Console.WriteLine($"[WARNING] Config file not found: {configPath}");
        }
    }
}
