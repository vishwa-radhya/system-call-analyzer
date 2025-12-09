// ==========================================
//  Behavior Engine v3.0 — Final Unified Version
// ==========================================

const processStats = new Map();

const CONFIG = {
  WINDOW_MS: 60_000,

  // Event-type thresholds per minute
  THRESHOLDS: {
    ProcessStart: 8,
    FileRead: 40,
    FileWrite: 25,
    RegistryAccess: 35,
    NetworkConnect: 30
  },

  // Weights for final normalized scoring
  WEIGHTS: {
    spawnRate: 0.20,
    netRate: 0.20,
    fileRate: 0.15,
    registryRate: 0.10,
    diversity: 0.10,
    burstiness: 0.15,
    corrScore: 0.10
  },

  MAX_SCORE: 100,
  DECAY_RATE: 5
};

// -------------------------
// Helpers
// -------------------------
function ensureProcess(name) {
  if (!processStats.has(name)) {
    processStats.set(name, {
      events: {},          // { EventType: [timestamps] }
      totalScore: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      lastVector: null
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

function rate(stats, type) {
  const count = stats.events[type]?.length || 0;
  const threshold = CONFIG.THRESHOLDS[type] || 20;

  return Math.min(1, count / threshold);
}

function diversity(stats) {
  const types = Object.keys(stats.events).length;
  return Math.min(1, types / 6);
}

function burstiness(stats) {
  const values = Object.values(stats.events).map(arr => arr.length);
  if (values.length <= 1) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);

  return Math.min(1, stddev / (mean || 1));
}

function correlation(stats) {
  const e = stats.events;

  const spawnMany = (e.ProcessStart?.length || 0) > CONFIG.THRESHOLDS.ProcessStart;
  const highWrites = (e.FileWrite?.length || 0) > CONFIG.THRESHOLDS.FileWrite;
  const highNet = (e.NetworkConnect?.length || 0) > CONFIG.THRESHOLDS.NetworkConnect;

  if (spawnMany && highWrites) return 0.8;
  if (highNet && highWrites) return 0.7;
  if (spawnMany && highNet) return 0.6;

  return 0;
}

// Compute normalized final behavior score
function computeScore(v) {
  const w = CONFIG.WEIGHTS;
  return (
    v.spawnRate * w.spawnRate +
    v.netRate * w.netRate +
    v.fileRate * w.fileRate +
    v.registryRate * w.registryRate +
    v.diversity * w.diversity +
    v.burstiness * w.burstiness +
    v.corrScore * w.corrScore
  );
}

function severity(score) {
  if (score >= 75) return "Critical";
  if (score >= 40) return "High";
  if (score >= 15) return "Medium";
  return "Low";
}

function detectTimelineChanges(stats, vector) {
  const changes = [];
  const prev = stats.lastVector;

  if (!prev) return changes;

  function delta(name) {
    return vector[name] - prev[name];
  }

  if (delta("spawnRate") > 0.3)
    changes.push("Sudden spike in process creation rate.");

  if (delta("netRate") > 0.3)
    changes.push("Network activity burst detected.");

  if (delta("fileRate") > 0.3)
    changes.push("Rapid increase in file operations.");

  if (delta("burstiness") > 0.25)
    changes.push("Behavior has become irregular and bursty.");

  return changes;
}

// ==========================================
// MAIN ENGINE
// ==========================================
export function evaluateBehavior(event) {
  const { ProcessName, EventType } = event;

  if (!ProcessName || !EventType) {
    return { score: 0, severity: "Low", reasons: [] };
  }

  const stats = ensureProcess(ProcessName);
  recordEvent(stats, EventType);

  // Compute behavioral metrics
  const v = {
    spawnRate: rate(stats, "ProcessStart"),
    netRate: rate(stats, "NetworkConnect"),
    fileRate: (rate(stats, "FileRead") + rate(stats, "FileWrite")) / 2,
    registryRate: rate(stats, "RegistryAccess"),
    diversity: diversity(stats),
    burstiness: burstiness(stats),
    corrScore: correlation(stats)
  };

  const normalized = computeScore(v);
  const score = Math.floor(normalized * CONFIG.MAX_SCORE);
  const sev = severity(score);

  const reasons = [];

  if (score > 0) {
    reasons.push({
      layer: "Behavioral",
      metric: "BehavioralProfile",
      score,
      severity: sev,
      reason: `Abnormal behavior pattern detected for ${ProcessName}.`,
      vector: v,
      eventFragment: event
    });
  }

  // Timeline reasoning (spikes/trends)
  const timelineFlags = detectTimelineChanges(stats, v);
  if (timelineFlags.length > 0) {
    reasons.push({
      layer: "Behavioral",
      metric: "TimelinePattern",
      score,
      severity: sev,
      reason: timelineFlags.join(" "),
      vector: v,
      eventFragment: event
    });
  }

  // Save vector for future comparisons
  stats.lastVector = v;

  // Update global cumulative score
  stats.totalScore = Math.max(0, stats.totalScore + score);

  return { score, severity: sev, reasons };
}

// ==========================================
// DECAY
// ==========================================
export function applyScoreDecay(rate = CONFIG.DECAY_RATE) {
  const now = Date.now();
  for (const [, stats] of processStats) {
    stats.totalScore = Math.max(0, stats.totalScore - rate);

    for (const type in stats.events) {
      stats.events[type] = stats.events[type].filter(
        ts => now - ts <= CONFIG.WINDOW_MS
      );
    }
  }
}
