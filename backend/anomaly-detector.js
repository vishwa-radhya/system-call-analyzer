
// Suspicious process names (customize as needed)
const suspiciousProcesses = ["powershell", "cmd", "wscript", "cscript"];

export function detectAnomalies(log) {
  const anomalies = [];

  // ----------------- Process Rules -----------------
  if (log.EventType && log.EventType.startsWith("Process")) {
    const proc = log.ProcessName?.toLowerCase() || "";

    if (suspiciousProcesses.includes(proc)) {
      anomalies.push({
        Reason: `Suspicious process started: ${log.ProcessName}`,
        Log: log
      });
    }
  }

  // ----------------- File I/O Rules -----------------
  if (log.EventType && log.EventType.startsWith("File")) {
    const path = log.FilePath?.toLowerCase() || "";

    if (path.includes("\\windows\\system32") || path.includes("\\windows\\temp")) {
      anomalies.push({
        Reason: `File access in sensitive directory: ${log.FilePath}`,
        Log: log
      });
    }

    if (path.endsWith(".exe") || path.endsWith(".dll") || path.endsWith(".bat")) {
      anomalies.push({
        Reason: `Suspicious file type written: ${log.FilePath}`,
        Log: log
      });
    }
  }

  // ----------------- Network Rules -----------------
  if (log.EventType && log.EventType.startsWith("Network")) {
    const addr = log?.Extra?.RemoteAddress;
    const port = log?.Extra?.RemotePort;

    // Example: flag external IPs (not private/local)
    if (addr && !addr.startsWith("192.168.") && !addr.startsWith("10.") && !addr.startsWith("127.")) {
      anomalies.push({
        Reason: `External network connection detected: ${addr}:${port}`,
        Log: log
      });
    }

    if (port && port > 1024 && ![80, 443, 22].includes(port)) {
      anomalies.push({
        Reason: `Uncommon network port used: ${port}`,
        Log: log
      });
    }
  }

  // Format anomaly objects for frontend
  return anomalies.map(a => ({
    Anomaly: true,
    ...a
  }));
}

