// rules.js (updated)

const BROWSER_LIKE_PROCESSES = [
  "chrome",
  "msedge",
  "edge",
  "firefox",
  "opera",
  "brave",
  "ChatGPT",    // from your logs
  "Code"        // VS Code from your logs
];

const SERVICE_LIKE_PROCS = [
  "svchost",
  "services",
  "System",
];

// Helper: treat value as-is (your ETW ProcessName is case-sensitive in logs)
function isBrowserLike(name) {
  if (!name) return false;
  return BROWSER_LIKE_PROCESSES.includes(name);
}

function isServiceLike(name) {
  if (!name) return false;
  return SERVICE_LIKE_PROCS.includes(name);
}

export const rulesByType = {
  process: [
    {
      name: "EncodedPowerShell",
      severity: "high",
      mitre: "T1059.001", // powershell
      conditions: {
        all: [
          { field: "ProcessName", operator: "equals", expected: "powershell" },
          { field: "Extra.ImageFileName", operator: "regex", expected: "powershell\\.exe" },
          { field: "CommandLine", operator: "regex", expected: "encodedcommand|enc\\s" }
        ]
      },
      // high severity, but keep weight small
      weight: 1,
      reason: log => `Encoded PowerShell command detected: ${log.CommandLine}`
    },

    {
      name: "LOLbinsExecution",
      severity: "medium",
      mitre: "T1218",
      conditions: {
        any: [
          { field: "ProcessName", operator: "in", expected: ["mshta", "rundll32", "regsvr32", "wscript", "cscript"] },
          { field: "Extra.ImageFileName", operator: "regex", expected: "mshta|rundll32|regsvr32|wscript|cscript" }
        ]
      },
      weight: 0,
      reason: log => `Execution via LOLBin: ${log.ProcessName}`
    },

    {
      name: "SuspiciousParentPID",
      severity: "medium",
      mitre: "T1055",
      conditions: {
        all: [
          { field: "EventType", operator: "equals", expected: "ProcessStart" },
          // PID 4 = SYSTEM, but this can be noisy; still useful as a *hint*
          { field: "Extra.ParentPid", operator: "equals", expected: 4 }
        ]
      },
      weight: -1, // slightly down-weight: can be benign
      reason: log => `Process ${log.ProcessName} started by SYSTEM (PID 4)`
    },

    {
      name: "RapidSpawn",
      severity: "low",
      mitre: "T1106",
      // NOTE: actual "rapid" frequency is better modeled by behavior engine.
      check: log =>
        log.EventType === "ProcessStart" &&
        ["cmd", "powershell", "wscript"].includes(log.ProcessName?.toLowerCase?.() || ""),
      weight: 0,
      reason: log => `Potentially suspicious tool spawning: ${log.ProcessName}`
    }
  ],

  file: [
    {
      name: "WriteToSystem32",
      severity: "high",
      mitre: "T1068",
      conditions: {
        all: [
          { field: "EventType", operator: "equals", expected: "FileWrite" },
          { field: "FilePath", operator: "regex", expected: "windows\\\\system32" }
        ]
      },
      weight: 1,
      reason: log => `Write attempt in System32 directory: ${log.FilePath}`
    },

    {
      name: "ExecutableDroppedInTemp",
      severity: "medium",
      mitre: "T1059",
      conditions: {
        all: [
          { field: "FilePath", operator: "regex", expected: "temp" },
          { field: "FilePath", operator: "regex", expected: "\\.(exe|dll|bat|vbs)$" }
        ]
      },
      weight: 0,
      reason: log => `Suspicious executable dropped in Temp directory: ${log.FilePath}`
    },

    {
      name: "ScriptFileAccess",
      severity: "low",
      mitre: "T1059",
      conditions: {
        all: [
          { field: "FilePath", operator: "regex", expected: "\\.(ps1|vbs|js|bat)$" }
        ]
      },
      weight: -1, // pretty common; keep it as a soft signal
      reason: log => `Script file accessed: ${log.FilePath}`
    }
  ],

  network: [
    {
      name: "ExternalIPConnection",
      severity: "low",            // weak signal
      mitre: "T1105",
      weight: 0,                  // no extra inflation

      check: log => {
        if (log.EventType !== "NetworkConnect") return false;

        const remote = log.Extra?.RemoteAddress;
        const port   = log.Extra?.RemotePort;
        const proc   = log.ProcessName;

        if (!remote || !port || !proc) return false;

        // ------------------------------
        // 1. Ignore local / private IPs
        // ------------------------------
        const local =
          /^127\./.test(remote) ||
          /^10\./.test(remote) ||
          /^192\.168\./.test(remote) ||
          /^172\.(1[6-9]|2\d|3[0-1])\./.test(remote);

        if (local) return false;

        // ------------------------------
        // 2. Ignore browsers & common dev tools
        // ------------------------------
        const procLC = proc.toLowerCase();
        const benignProcs = [
          "chrome",
          "edge",
          "msedge",
          "firefox",
          "opera",
          "brave",
          "code",
          "visualstudio",
          "vscode",
          "slack",
          "discord",
          "teams",
          "chatgpt",
          "dotnet",
          "pwsh",
          "powershell",
          "svchost"
        ];

        if (benignProcs.some(p => procLC.includes(p))) {
          return false; // unless we have correlation (behavior engine)
        }

        // ------------------------------
        // 3. Ignore common ports for single events
        // ------------------------------
        const commonPorts = [80, 443];
        if (commonPorts.includes(port)) {
          // Weak signal: let behavior engine decide later if bursty
          return false; 
        }

        // ------------------------------
        // 4. Rare external connection
        //    (non-browser, non-dev, uncommon port)
        // ------------------------------
        return true;
      },

      reason: log =>
        `Suspicious outbound connection from ${log.ProcessName} to ${log.Extra?.RemoteAddress}:${log.Extra?.RemotePort}`
    },

    {
      name: "UncommonPort",
      severity: "low",
      mitre: "T1041",
      // Only NetworkConnect, and ignore common ports + browser-like procs
      check: log => {
        if (log.EventType !== "NetworkConnect") return false;
        const port = log.Extra?.RemotePort;
        const proc = log.ProcessName;

        if (!port) return false;
        if (isBrowserLike(proc)) return false;

        const commonPorts = [80, 443, 8080, 22, 53];
        return !commonPorts.includes(port);
      },
      weight: 0,
      reason: log => `Connection using uncommon port ${log.Extra?.RemotePort} by ${log.ProcessName}`
    },

    {
      name: "HighFrequencyConnections",
      severity: "low",
      mitre: "T1071",
      // This is more a hint; real frequency is behavior-engine territory.
      check: log =>
        log.EventType === "NetworkConnect" &&
        ["powershell", "cmd", "wscript"].includes(log.ProcessName?.toLowerCase?.() || ""),
      weight: 1,
      reason: log => `Script/tool making network connections: ${log.ProcessName}`
    }
  ]
};
