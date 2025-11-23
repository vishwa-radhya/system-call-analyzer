// =======================
// Behavioral Engine v2.0
// =======================

const processStats = new Map();

/*
CONFIG PARAMETERS
----------------------------
These values decide how sensitive the engine is.
Tune based on real logs later.
*/
const CONFIG = {
  WINDOW_MS: 60_000, // 60s sliding window
  DECAY_RATE: 5,
  MAX_SCORE_PER_METRIC: 30,

  // Thresholds per event type (events per minute)
  THRESHOLDS: {
    ProcessStart: 8,
    ProcessStop: 8,
    FileRead: 40,
    FileWrite: 25,
    RegistryAccess: 35,
    NetworkConnect: 30
  }
};

// Initialize process bucket
function ensureProcess(processName) {
  if (!processStats.has(processName)) {
    processStats.set(processName, {
      events: {},           // { EventType: [timestamps...] }
      totalScore: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
    });
  }
  return processStats.get(processName);
}

// Record timestamp + keep only last WINDOW_MS
function recordEvent(stats, eventType) {
  if (!stats.events[eventType]) stats.events[eventType] = [];
  const now = Date.now();

  stats.events[eventType].push(now);
  stats.lastSeen = now;

  // Evict old timestamps
  stats.events[eventType] = stats.events[eventType].filter(
    ts => now - ts <= CONFIG.WINDOW_MS
  );
}

// Compute normalized frequency → score (0–MAX_SCORE)
function computeFrequencyScore(eventType, count) {
  const threshold = CONFIG.THRESHOLDS[eventType] || 25;

  if (count <= threshold) return 0;

  // Normalization
  const excess = count - threshold;
  const multiplier = Math.min(1, excess / threshold);

  return Math.floor(multiplier * CONFIG.MAX_SCORE_PER_METRIC);
}

// ============= MAIN EVALUATION FUNCTION =============
export function evaluateBehavior(event) {
  const reasons = [];
  let score = 0;

  const { ProcessName, EventType } = event;
  if (!ProcessName || !EventType) return { score, reasons };

  const stats = ensureProcess(ProcessName);

  // Track event
  recordEvent(stats, EventType);

  const counts = stats.events[EventType]?.length || 0;

  // Compute behavioral score for this event type
  const metricScore = computeFrequencyScore(EventType, counts);

  if (metricScore > 0) {
    score += metricScore;

    reasons.push({
      layer: "Behavioral",
      metric: `${EventType}Frequency`,
      severity: metricScore >= 20 ? "High" : "Medium",
      score: metricScore,
      reason: `${ProcessName} triggered ${EventType} ${counts} times within the last ${CONFIG.WINDOW_MS / 1000}s`,
      eventFragment: event
    });
  }

  // Update total score with decay constraint
  stats.totalScore = Math.max(0, (stats.totalScore || 0) + score);
  return { score, reasons };
}


// ========================
// GLOBAL DECAY APPLICATOR
// ========================
export function applyScoreDecay(rate = CONFIG.DECAY_RATE) {
  const now = Date.now();

  for (const [, stats] of processStats) {
    stats.totalScore = Math.max(0, stats.totalScore - rate);

    // also decay event timestamps older than window
    for (const eventType in stats.events) {
      stats.events[eventType] = stats.events[eventType].filter(
        ts => now - ts <= CONFIG.WINDOW_MS
      );
    }
  }
}

