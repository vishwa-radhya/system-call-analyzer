const processStats = new Map();

const NETWORK_THRESHOLD = 30;
const PROCESS_THRESHOLD = 10;

export function evaluateBehavior(event) {
  const reasons = [];
  let score = 0;

  const { ProcessName, EventType } = event;
  if (!ProcessName) return { score, reasons };

  const now = Date.now();
  if (!processStats.has(ProcessName)) {
    processStats.set(ProcessName, { counts: {}, lastUpdated: now, totalScore: 0 });
  }

  const stats = processStats.get(ProcessName);
  stats.counts[EventType] = (stats.counts[EventType] || 0) + 1;
  stats.lastUpdated = now;

  // 🔹 Example 1: Too many process starts
  if (EventType === "ProcessStart" && stats.counts["ProcessStart"] > PROCESS_THRESHOLD) {
    score += 20;
    reasons.push({
      layer: "Behavioral",
      metric: "SpawnFrequency",
      score: 20,
      reason: `${ProcessName} started ${stats.counts["ProcessStart"]} times recently`
    });
  }

  // 🔹 Example 2: Excessive network connects
  if (EventType === "NetworkConnect" && stats.counts["NetworkConnect"] > NETWORK_THRESHOLD) {
    score += 25;
    reasons.push({
      layer: "Behavioral",
      metric: "NetworkConnectRate",
      score: 25,
      reason: `${ProcessName} made ${stats.counts["NetworkConnect"]} connections`
    });
  }

  // Update stored totals
  stats.totalScore = Math.max(0, (stats.totalScore || 0) + score);
  processStats.set(ProcessName, stats);

  return { score, reasons };
}

//  Periodic decay to keep behavior state fresh
export function applyScoreDecay(rate = 5) {
  for (const [, stats] of processStats.entries()) {
    stats.totalScore = Math.max(0, stats.totalScore - rate);
  }
}
