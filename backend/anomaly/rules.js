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
      reason: log => `Execution via LOLBin: ${log.ProcessName}`
    },

    {
      name: "SuspiciousParentPID",
      severity: "medium",
      mitre: "T1055",
      conditions: {
        all: [
          { field: "EventType", operator: "equals", expected: "ProcessStart" },
          { field: "Extra.ParentPid", operator: "equals", expected: 4 } // PID 4 = SYSTEM
        ]
      },
      reason: log => `Process ${log.ProcessName} started by SYSTEM (PID 4)`
    },

    {
      name: "RapidSpawn",
      severity: "low",
      mitre: "T1106",
      check: log =>
        log.EventType === "ProcessStart" &&
        ["cmd", "powershell", "wscript"].includes(log.ProcessName?.toLowerCase()),
      reason: log => `Rapid process spawning detected: ${log.ProcessName}`
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
      reason: log => `Script file accessed: ${log.FilePath}`
    }
  ],

  network: [
    {
      name: "ExternalIPConnection",
      severity: "medium",
      mitre: "T1105",
      conditions: {
        all: [
          { field: "Extra.RemoteAddress", operator: "regex", expected: "^(?!127\\.0\\.0\\.1|10\\.|172\\.16\\.|192\\.168\\.).*" }
        ]
      },
      reason: log =>
        `External connection detected: ${log.Extra?.RemoteAddress}:${log.Extra?.RemotePort}`
    },

    {
      name: "UncommonPort",
      severity: "low",
      mitre: "T1041",
      conditions: {
        all: [
          { field: "Extra.RemotePort", operator: "not_in", expected: [80, 443, 8080, 22] }
        ]
      },
      reason: log => `Connection using uncommon port: ${log.Extra?.RemotePort}`
    },

    {
      name: "HighFrequencyConnections",
      severity: "low",
      mitre: "T1071",
      check: log =>
        log.EventType === "NetworkConnect" &&
        ["powershell", "cmd", "wscript"].includes(log.ProcessName?.toLowerCase()),
      reason: log => `Script/tool making network connections: ${log.ProcessName}`
    }
  ]
};
