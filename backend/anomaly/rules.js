const suspiciousProcesses = ["powershell", "cmd", "wscript", "cscript"];

export const rulesByType = {
  process: [
    {
      name: "SuspiciousProcess",
      severity: "high",
      check: log =>
        log.EventType?.startsWith("Process") &&
        suspiciousProcesses.includes(log.ProcessName?.toLowerCase()),
      reason: log => `Suspicious process started: ${log.ProcessName}`
    },
    {
      name: "UnexpectedParent",
      severity: "medium",
      check: log =>
        log.EventType === "ProcessStart" &&
        log.Extra?.ParentPid === 4,
      reason: log =>
        `Process ${log.ProcessName} started with suspicious parent PID: ${log.Extra.ParentPid}`
    }
  ],

  file: [
    {
      name: "SensitiveDirAccess",
      severity: "medium",
      check: log =>
        log.EventType?.startsWith("File") &&
        /\\windows\\(system32|temp)/i.test(log.FilePath || ""),
      reason: log => `File access in sensitive directory: ${log.FilePath}`
    },
    {
      name: "SuspiciousFileType",
      severity: "medium",
      check: log =>
        log.EventType?.startsWith("File") &&
        /\.(exe|dll|bat)$/i.test(log.FilePath || ""),
      reason: log => `Suspicious file type accessed: ${log.FilePath}`
    }
  ],

  network: [
    {
      name: "ExternalConnection",
      severity: "medium",
      check: log => {
        if (!log.EventType?.startsWith("Network")) return false;
        const addr = log.Extra?.RemoteAddress;
        return (
          addr &&
          !addr.startsWith("192.168.") &&
          !addr.startsWith("10.") &&
          !addr.startsWith("127.")
        );
      },
      reason: log =>
        `External network connection detected: ${log.Extra?.RemoteAddress}:${log.Extra?.RemotePort}`
    },
    {
      name: "UncommonPort",
      severity: "low",
      check: log =>
        log.EventType?.startsWith("Network") &&
        log.Extra?.RemotePort &&
        ![80, 443, 22].includes(log.Extra.RemotePort),
      reason: log => `Uncommon network port used: ${log.Extra?.RemotePort}`
    }
  ]
};
