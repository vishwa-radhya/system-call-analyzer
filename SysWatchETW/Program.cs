using System;
using System.IO;
using System.Text.Json;
using System.Collections.Generic;
using Microsoft.Diagnostics.Tracing;
using Microsoft.Diagnostics.Tracing.Parsers;
using Microsoft.Diagnostics.Tracing.Session;

class Program
{
    static void Main(string[] args)
    {
        string projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", ".."));
        string logsDir = Path.Combine(projectRoot,"logs");
        Directory.CreateDirectory(logsDir);
        string logFile = Path.Combine(logsDir, "SysWatch.jsonl");
        string filtersFile = "filters.json"; 

        Console.WriteLine($"[SysWatch] Starting ETW session...");
        Console.WriteLine($"[SysWatch] Logs -> {logFile}");
        Console.WriteLine($"[SysWatch] Filters -> {filtersFile}");

        var filters = LoadFilters(filtersFile);

        // Open log stream for appending JSONL
        using var logStream = new StreamWriter(logFile, append: true);

        // Start ETW session
        using (var session = new TraceEventSession("SysWatchSession"))
        {
            session.EnableKernelProvider(KernelTraceEventParser.Keywords.Process | KernelTraceEventParser.Keywords.FileIO);

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

            session.Source.Kernel.ProcessStop += data =>
            {
                var record = new SysEvent
                {
                    Timestamp = data.TimeStamp,
                    EventType = "ProcessStop",
                    ProcessName = data.ProcessName,
                    Pid = data.ProcessID
                };

                if (PassesFilters(record, filters))
                {
                    WriteJsonRecord(logStream, record);
                }
            };

            // Optional File I/O events
            session.Source.Kernel.FileIORead += data =>
            {
                var record = new SysEvent
                {
                    Timestamp = data.TimeStamp,
                    EventType = "FileIO",
                    ProcessName = data.ProcessName,
                    Pid = data.ProcessID,
                    FilePath = data.FileName
                };

                if (PassesFilters(record, filters))
                {
                    WriteJsonRecord(logStream, record);
                }
            };

            session.Source.Kernel.FileIOWrite += data =>
            {
                var record = new SysEvent
                {
                    Timestamp = data.TimeStamp,
                    EventType = "FileIO",
                    ProcessName = data.ProcessName,
                    Pid = data.ProcessID,
                    FilePath = data.FileName
                };

                if (PassesFilters(record, filters))
                {
                    WriteJsonRecord(logStream, record);
                }
            };

            session.Source.Process(); // blocks and streams ETW events
        }
    }

    static void WriteJsonRecord(StreamWriter logStream, SysEvent record)
    {
        string json = JsonSerializer.Serialize(record);
        logStream.WriteLine(json);
        logStream.Flush(); // ensure realtime streaming
    }

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

    static bool PassesFilters(SysEvent record, List<FilterRule> filters)
    {
        foreach (var filter in filters)
        {
            if (filter.EventType != null &&
                !string.Equals(record.EventType, filter.EventType, StringComparison.OrdinalIgnoreCase))
                continue;

            if (filter.ProcessName != null &&
                (record.ProcessName == null ||
                !record.ProcessName.Contains(filter.ProcessName, StringComparison.OrdinalIgnoreCase)))
                continue;

            if (filter.FilePath != null &&
                (record.FilePath == null ||
                !record.FilePath.Contains(filter.FilePath, StringComparison.OrdinalIgnoreCase)))
                continue;

            return true; // passed one filter
        }
        return filters.Count == 0; // no filters = log everything
    }
}

// JSON schema for events
class SysEvent
{
    public DateTime Timestamp { get; set; }
    public string? EventType { get; set; }
    public string? ProcessName { get; set; }
    public int Pid { get; set; }
    public string? FilePath { get; set; }
    public Dictionary<string, object>? Extra { get; set; }
}

// JSON schema for filters
class FilterRule
{
    public string? EventType { get; set; }
    public string? ProcessName { get; set; }
    public string? FilePath { get; set; }
}
