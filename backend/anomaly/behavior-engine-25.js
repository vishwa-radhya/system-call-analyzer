const processStats = new Map();

const KNOWN_NOISY = [
  "chrome", "msedge", "edge", "firefox", "brave", "opera",
  "ChatGPT", "Code", "Teams", "slack", "discord",
  "svchost", "System", "services"
];

function isNoisy(process) {
  return KNOWN_NOISY.includes(process);
}

const CONFIG = {
  WINDOW_MS: 60_000,

  THRESHOLDS: {
    ProcessStart: 6,
    FileRead: 30,
    FileWrite: 15,
    FileCreate: 10,
    NetworkConnect: 25
  },

  WEIGHTS: {
    spawnRate: 0.3,
    netRate: 0.3,
    fileRate: 0.2,
    diversity: 0.1, // types of acts process performs, net+file+proc
    burstiness: 0.1, // how fast
    corr: 0.5  // correalte between those 3
  },

  MAX_SCORE: 10,   
  MIN_ANOMALY: 3,  
};

function ensureProcess(name) {
  if (!processStats.has(name)) {
    processStats.set(name, {
      events: {}, 
      lastSeen: Date.now()
    });
  }
  return processStats.get(name);
}

function recordEvent(stats, type) {
  const now = Date.now();
  if (!stats.events[type]) stats.events[type] = [];
  stats.events[type].push(now);
  stats.lastSeen = now;

  stats.events[type] = stats.events[type].filter(
    ts => now - ts <= CONFIG.WINDOW_MS
  );
}

function rate(stats, type, threshold) {
  const count = stats.events[type]?.length || 0;
  return Math.min(1, count / (CONFIG.THRESHOLDS[type] || threshold));
}

function diversity(stats) {
  return Math.min(1, Object.keys(stats.events).length / 6);
}

function burstiness(stats) {
  const values = Object.values(stats.events).map(arr => arr.length);
  if (values.length <= 1) return 0;

  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);

  return Math.min(1, stddev / (mean || 1));
}

function corr(stats) {
  const e = stats.events;
  const spawn = (e.ProcessStart?.length || 0) > CONFIG.THRESHOLDS.ProcessStart;
  const writes = (e.FileWrite?.length || 0) > CONFIG.THRESHOLDS.FileWrite;
  const creates = (e.FileCreate?.length || 0) > CONFIG.THRESHOLDS.FileCreate;
  const net = (e.NetworkConnect?.length || 0) > CONFIG.THRESHOLDS.NetworkConnect;

  //  unpacker (create new process and files)
  if (spawn && creates) return 1.0;

  // staged exfiltration (create files then connect to network)
  if (creates && net) return 0.95;

  // typical exfil (file write + network connect)
  if (writes && net) return 0.9;

  if (spawn && net) return 0.8;

  return 0;
}

function meta(v) {
  return (
    v.spawn * CONFIG.WEIGHTS.spawnRate +
    v.net * CONFIG.WEIGHTS.netRate +
    v.file * CONFIG.WEIGHTS.fileRate +
    v.div * CONFIG.WEIGHTS.diversity +
    v.burst * CONFIG.WEIGHTS.burstiness +
    v.corr * CONFIG.WEIGHTS.corr
  );
}


export function evaluateBehavior(event) {
  const reasons = [];
  const { ProcessName, EventType } = event;

  if (!ProcessName || !EventType) return { score: 0, reasons };

  const stats = ensureProcess(ProcessName);
  recordEvent(stats, EventType);

  const v = {
    spawn: rate(stats, "ProcessStart"),
    net: rate(stats, "NetworkConnect"),
    file: (rate(stats, "FileRead") + rate(stats, "FileWrite")+ rate(stats,"FileCreate")) / 3,
    div: diversity(stats),
    burst: burstiness(stats),
    corr: corr(stats)
  };

  const raw = meta(v);
  const score = Math.floor(raw * CONFIG.MAX_SCORE);

  if (isNoisy(ProcessName)) {
    if (v.corr === 0) return { score: 0, reasons: [] };
  }

  if (
    score < CONFIG.MIN_ANOMALY ||
    (v.corr === 0 && v.burst < 0.2 && v.div < 0.2)
  ) {
    return { score: 0, reasons: [] };
  }


  const sev =
    score >= 8 ? "High" :
    score >= 6 ? "Medium" :
    "Low";

  reasons.push({
    layer: "Behavioral",
    metric: "BehaviorProfile",
    score,
    severity: sev,
    reason: `${ProcessName} anomalous behavior: spawn=${v.spawn.toFixed(2)}, net=${v.net.toFixed(2)}, file=${v.file.toFixed(2)}, div=${v.div.toFixed(2)}, burst=${v.burst.toFixed(2)}, corr=${v.corr.toFixed(2)}`,
    vector: v,
    eventFragment: event
  });

  return { score, reasons };
}


export function applyScoreDecay() {
  const now = Date.now();
  for (const [, stats] of processStats) {
    for (const type in stats.events) {
      stats.events[type] = stats.events[type].filter(
        ts => now - ts <= CONFIG.WINDOW_MS
      );
    }
  }
}
