// ========================================
// Behavior Engine v2.5 — Aggregator Edition
// ========================================

const processStats = new Map();

const CONFIG = {
  WINDOW_MS: 60_000,

  // Thresholds for individual event-type frequency
  THRESHOLDS: {
    ProcessStart: 8,
    FileRead: 40,
    FileWrite: 25,
    RegistryAccess: 35,
    NetworkConnect: 30
  },

  // Weight mapping for composite derived metrics
  WEIGHTS: {
    spawnRate: 0.25,
    netRate: 0.25,
    fileRate: 0.2,
    registryRate: 0.15,
    diversity: 0.1,
    burstiness: 0.15,
    correlations: 0.2
  },

  MAX_SCORE: 35,
  DECAY_RATE: 5
};

// Initialize stats for process
function ensureProcess(name) {
  if (!processStats.has(name)) {
    processStats.set(name, {
      events: {}, // { EventType: [timestamps] }
      totalScore: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now()
    });
  }
  return processStats.get(name);
}

// Record event and maintain 60s bucket
function recordEvent(stats, eventType) {
  const now = Date.now();
  if (!stats.events[eventType]) stats.events[eventType] = [];

  stats.events[eventType].push(now);
  stats.lastSeen = now;

  stats.events[eventType] = stats.events[eventType].filter(
    ts => now - ts <= CONFIG.WINDOW_MS
  );
}

// Derived rates: count per minute normalized 0–1
function rate(stats, type) {
  const count = stats.events[type]?.length || 0;
  const threshold = CONFIG.THRESHOLDS[type] || 20;

  return Math.min(1, count / threshold);
}

// Diversity index: how many different event types occurred
function diversityIndex(stats) {
  const types = Object.keys(stats.events).length;
  return Math.min(1, types / 6); // normalize (assumes ~6 event types max)
}

// Burstiness index: irregularity = std deviation of event counts
function burstinessIndex(stats) {
  const values = Object.values(stats.events).map(arr => arr.length);
  if (values.length <= 1) return 0;

  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const stddev = Math.sqrt(variance);

  // Normalize
  return Math.min(1, stddev / (mean || 1));
}

// Correlation checks — returns 0–1
function correlationScore(stats) {
  const e = stats.events;

  const spawnMany = (e.ProcessStart?.length || 0) > CONFIG.THRESHOLDS.ProcessStart;
  const highWrites = (e.FileWrite?.length || 0) > CONFIG.THRESHOLDS.FileWrite;
  const highNet = (e.NetworkConnect?.length || 0) > CONFIG.THRESHOLDS.NetworkConnect;

  // suspicious combinations
  if (spawnMany && highWrites) return 0.8; // unpacking behavior
  if (highNet && highWrites) return 0.7;   // exfiltration pattern
  if (spawnMany && highNet) return 0.6;    // beaconing bursts

  return 0;
}

// Composite normalized score 0–1
function computeMetaScore(v) {
  return (
    v.spawnRate * CONFIG.WEIGHTS.spawnRate +
    v.netRate * CONFIG.WEIGHTS.netRate +
    v.fileRate * CONFIG.WEIGHTS.fileRate +
    v.registryRate * CONFIG.WEIGHTS.registryRate +
    v.diversity * CONFIG.WEIGHTS.diversity +
    v.burstiness * CONFIG.WEIGHTS.burstiness +
    v.corrScore * CONFIG.WEIGHTS.correlations
  );
}

// ========================================
// MAIN ENGINE
// ========================================
export function evaluateBehavior(event) {
  const reasons = [];
  const { ProcessName, EventType } = event;

  if (!ProcessName || !EventType) return { score: 0, reasons };

  const stats = ensureProcess(ProcessName);
  recordEvent(stats, EventType);

  // Derive metrics
  const v = {
    spawnRate: rate(stats, "ProcessStart"),
    netRate: rate(stats, "NetworkConnect"),
    fileRate: (rate(stats, "FileRead") + rate(stats, "FileWrite")) / 2,
    registryRate: rate(stats, "RegistryAccess"),
    diversity: diversityIndex(stats),
    burstiness: burstinessIndex(stats),
    corrScore: correlationScore(stats)
  };

  // Meta behavioral score (0–MAX_SCORE)
  const normalized = computeMetaScore(v);
  const score = Math.floor(normalized * CONFIG.MAX_SCORE);

  if (score > 0) {
    // Behavioral summary reason
    reasons.push({
      layer: "Behavioral",
      metric: "BehaviorProfile",
      score,
      severity: score >= 25 ? "High" : score >= 15 ? "Medium" : "Low",
      reason: `${ProcessName} exhibits abnormal behavior pattern: ` +
        `spawn=${v.spawnRate.toFixed(2)}, net=${v.netRate.toFixed(2)}, ` +
        `file=${v.fileRate.toFixed(2)}, diversity=${v.diversity.toFixed(2)}, ` +
        `burstiness=${v.burstiness.toFixed(2)}, corr=${v.corrScore.toFixed(2)}`,
      vector: v,
      eventFragment: event
    });
  }

  // Update total score
  stats.totalScore = Math.max(0, stats.totalScore + score);

  return { score, reasons };
}

// ========================================
// DECAY
// ========================================
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
