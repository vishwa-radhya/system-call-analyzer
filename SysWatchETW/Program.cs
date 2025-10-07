using System.Text.Json;
using Microsoft.Diagnostics.Tracing.Parsers;
using Microsoft.Diagnostics.Tracing.Session;
class Program
{
    static Dictionary<int, string> pidNameMap = new();
    static bool _isPaused = false; // control flag
    static StreamWriter? logStream;
    static void Main(string[] args)
    {
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
        string projectRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", ".."));
        string logsDir = Path.Combine(projectRoot, "logs");
        Directory.CreateDirectory(logsDir);
        string logFile = Path.Combine(logsDir, "SysWatch.jsonl");
        string filtersFile = "filters.json";

        Console.WriteLine($"[SysWatch] Starting ETW session...");
        Console.WriteLine($"[SysWatch] Logs -> {logFile}");
        Console.WriteLine($"[SysWatch] Filters -> {filtersFile}");

        var filters = LoadFilters(filtersFile);
        foreach (var f in filters)
        {
            Console.WriteLine($"EventTypes: {string.Join(",", f.EventTypes ?? new List<string>())}");
        }
        // Open log stream for appending JSONL
        logStream = new StreamWriter(new FileStream(logFile, FileMode.Append, FileAccess.Write, FileShare.ReadWrite)) { AutoFlush = true };
        // Start ETW session
        using (var session = new TraceEventSession("SysWatchSession"))
        {
            session.EnableKernelProvider(KernelTraceEventParser.Keywords.Process | KernelTraceEventParser.Keywords.FileIO | KernelTraceEventParser.Keywords.FileIOInit | KernelTraceEventParser.Keywords.NetworkTCPIP);

            // Process start event
            session.Source.Kernel.ProcessStart += data =>
            {
                if (_isPaused) return;
                pidNameMap[data.ProcessID] = data.ProcessName ?? "";
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

            // Process Stop Event
            session.Source.Kernel.ProcessStop += data =>
            {
                if (_isPaused) return;
                string name = string.IsNullOrEmpty(data.ProcessName) &&
                  pidNameMap.TryGetValue(data.ProcessID, out var cachedName) ? cachedName : data.ProcessName;
                var record = new SysEvent
                {
                    Timestamp = data.TimeStamp,
                    EventType = "ProcessStop",
                    ProcessName = name,
                    Pid = data.ProcessID
                };

                if (PassesFilters(record, filters))
                {
                    WriteJsonRecord(logStream, record);
                }
                pidNameMap.Remove(data.ProcessID);
            };
            // Nwtwork Connect Event
            session.Source.Kernel.TcpIpConnect += data =>
            {
                var record = new SysEvent
                {
                    Timestamp = data.TimeStamp,
                    EventType = "NetworkConnect",
                    ProcessName = data.ProcessName,
                    Pid = data.ProcessID,
                    Extra = new Dictionary<string, object>
                    {
                        ["Operation"] = "Connect",
                        ["Protocol"] = "TCP",
                        ["LocalAddress"] = data.saddr.ToString(),
                        ["LocalPort"] = data.sport,
                        ["RemoteAddress"] = data.daddr.ToString(),
                        ["RemotePort"] = data.dport
                    }
                };
                if (PassesFilters(record, filters))
                {
                    WriteJsonRecord(logStream!, record);
                }
            };
            // Network Disconnect Event
            session.Source.Kernel.TcpIpDisconnect += data =>
            {
                var record = new SysEvent
                {
                    Timestamp = data.TimeStamp,
                    EventType = "NetworkDisconnect",
                    ProcessName = data.ProcessName,
                    Pid = data.ProcessID,
                    Extra = new Dictionary<string, object>
                    {
                        ["Operation"] = "Disconnect",
                        ["Protocol"] = "TCP",
                        ["LocalAddress"] = data.saddr.ToString(),
                        ["LocalPort"] = data.sport,
                        ["RemoteAddress"] = data.daddr.ToString(),
                        ["RemotePort"] = data.dport
                    }
                };
                if (PassesFilters(record, filters))
                {
                    WriteJsonRecord(logStream!, record);
                }
            };

            // File I/O events
            session.Source.Kernel.FileIORead += data =>
            {
                if (_isPaused) return;
                if (string.IsNullOrEmpty(data.FileName)) return;
                var record = new SysEvent
                {
                    Timestamp = data.TimeStamp,
                    EventType = "FileRead",
                    ProcessName = data.ProcessName,
                    Pid = data.ProcessID,
                    FilePath = data.FileName
                };
                if (PassesFilters(record, filters))
                {
                    WriteJsonRecord(logStream!, record);
                }
            };

            session.Source.Kernel.FileIOWrite += data =>
            {
                if (_isPaused) return;
                if (string.IsNullOrEmpty(data.FileName)) return;
                var record = new SysEvent
                {
                    Timestamp = data.TimeStamp,
                    EventType = "FileWrite",
                    ProcessName = data.ProcessName,
                    Pid = data.ProcessID,
                    FilePath = data.FileName
                };
                if (PassesFilters(record, filters))
                {
                    WriteJsonRecord(logStream!, record);
                }
            };

            session.Source.Kernel.FileIORename += data =>
            {
                if (_isPaused) return;
                if (string.IsNullOrEmpty(data.FileName)) return;
                var record = new SysEvent
                {
                    Timestamp = data.TimeStamp,
                    EventType = "FileRename",
                    ProcessName = data.ProcessName,
                    Pid = data.ProcessID,
                    FilePath = data.FileName
                };
                if (PassesFilters(record, filters))
                {
                    WriteJsonRecord(logStream!, record);
                }
            };

            session.Source.Process(); // blocks and streams ETW events
        }
    }
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
                    )
                    { AutoFlush = true };
                    Console.WriteLine("[SysWatch] Logging resumed and file hanlde reopened.");
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
    static void WriteJsonRecord(StreamWriter logStream, SysEvent record)
    {
        if (_isPaused || logStream == null) return; // skip if paused or closed
        try
        {
            string json = JsonSerializer.Serialize(record);
            logStream.WriteLine(json);
            logStream.Flush(); // realtime streaming
        }
        catch (ObjectDisposedException)
        {
            Console.WriteLine("[SysWatch] Attempted to write while logStream was closed");
        }
    }

    static List<FilterRule> LoadFilters(string path)
    {
        if (!File.Exists(path))
        {
            Console.WriteLine($"[SysWatch] No filters.json found, logging everything...");
            return new List<FilterRule>();
        }

        string json = File.ReadAllText(path);
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
        return JsonSerializer.Deserialize<List<FilterRule>>(json, options) ?? new List<FilterRule>();
    }

    static bool PassesFilters(SysEvent record, List<FilterRule> filters)
    {
        if (filters.Count == 0)
            return true; // no filters = log everything
        var filter = filters[0]; // we only have one filter object in filters.json
        // Event type filter (applies to all events)
        if (filter.EventTypes != null && filter.EventTypes.Count > 0 &&
            !filter.EventTypes.Contains(record.EventType, StringComparer.OrdinalIgnoreCase))
            return false;
        // File event filtering (apply to all File* events)
        if (record.EventType.StartsWith("File", StringComparison.OrdinalIgnoreCase))
        {
            // Exclude paths
            if (filter.ExcludePaths != null && filter.ExcludePaths.Count > 0 &&
                record.FilePath != null &&
                filter.ExcludePaths.Any(path => record.FilePath.StartsWith(path, StringComparison.OrdinalIgnoreCase)))
                return false;

            // Include paths (if defined,match at least one)
            if (filter.IncludePaths != null && filter.IncludePaths.Count > 0 &&
                (record.FilePath == null ||
                !filter.IncludePaths.Any(path => record.FilePath.StartsWith(path, StringComparison.OrdinalIgnoreCase))))
                return false;
        }
        return true;
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
    public List<string>? EventTypes { get; set; }
    public List<string>? IncludePaths { get; set; }
    public List<string>? ExcludePaths { get; set; }
}