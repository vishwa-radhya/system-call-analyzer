import { parentPort } from "worker_threads";
import { evaluateRules } from "./rule-engine.js";
import { evaluateBehavior, applyScoreDecay } from "./behavior-engine-25.js"; 
import {
  MIN_ANOMALY_SCORE,
  SCORE_DECAY_INTERVAL,
  SCORE_DECAY_RATE,
  SEVERITY_THRESHOLDS
} from "./config.js";

function calculateSeverity(score) {
  if (score <= SEVERITY_THRESHOLDS.Low)     return "Normal";
  if (score <= SEVERITY_THRESHOLDS.Medium)  return "Low";
  if (score <= SEVERITY_THRESHOLDS.High)    return "Medium";
  if (score <= SEVERITY_THRESHOLDS.Critical)return "High";
  return "Critical";
}

function fuseScores(ruleScore, behaviorScore) {
  const raw = ruleScore + behaviorScore;
  return Math.min(12, Math.floor(raw));
}

function mergeReasons(ruleReasons, behReasons) {
  const merged = [...(ruleReasons || []), ...(behReasons || [])];
  merged.sort((a, b) => (b.score || 0) - (a.score || 0));
  return merged;
}

setInterval(() => applyScoreDecay(SCORE_DECAY_RATE), SCORE_DECAY_INTERVAL);


const BATCH_WINDOW_MS = 900;
const SCORE_SIMILARITY = 0.15;

let currentBatch = null;

function vectorsSimilar(a, b) {
  const keys = ["spawn", "net", "file", "div", "burst", "corr"];

  // Detect spawn-only pattern (no file, no net, no corr)
  const aSpawnOnly = (a.net === 0 && a.file === 0 && a.corr === 0);
  const bSpawnOnly = (b.net === 0 && b.file === 0 && b.corr === 0);

  const threshold = (aSpawnOnly && bSpawnOnly)
    ? 0.35     // can handle spawn=0.5,0.67,0.83,1.00
    : 0.15;    // strict for multi-signal anomalies

  return keys.every(k => Math.abs(a[k] - b[k]) < threshold);
}


function flushBatch() {
  if (!currentBatch) return;

  const avg = {};
  const keys = ["spawn","net","file","div","burst","corr"];

  // compute averages
  for (const k of keys) {
    avg[k] = currentBatch.sum[k] / currentBatch.count;
  }

  parentPort.postMessage({
    type: "anomalyBatch",
    timestamp: new Date().toISOString(),
    process: currentBatch.process,
    severity: currentBatch.maxSeverity,
    count: currentBatch.count,

    avgScores: avg,
    startTime: new Date(currentBatch.start).toISOString(),
    endTime: new Date(currentBatch.last).toISOString(),
    durationMs: currentBatch.last - currentBatch.start,
    reasons: currentBatch.reasons,
  });

  currentBatch = null;
}

function addToBatch(process, severity, vector, reasons) {
  const now = Date.now();

  if (
    !currentBatch ||
    currentBatch.process !== process ||
    currentBatch.severity !== severity ||
    now - currentBatch.last > BATCH_WINDOW_MS ||
    !vectorsSimilar(currentBatch.refVector, vector)
  ) {
    flushBatch();

    // start new batch
    currentBatch = {
      process,
      severity,
      start: now,
      last: now,
      count: 1,
      sum: { ...vector },
      refVector: { ...vector },
      reasons,
      maxSeverity:severity
    };
  } else {
    // add into existing batch
    currentBatch.count++;
    currentBatch.last = now;

    // accumulate scores
    for (const k in vector) {
      currentBatch.sum[k] += vector[k];
    }

    const order = ["Normal", "Low", "Medium", "High", "Critical"];
    if (order.indexOf(severity) > order.indexOf(currentBatch.maxSeverity)) {
      currentBatch.maxSeverity = severity;
    }
  }
}

parentPort.on("message", (event) => {
  try {
    if (!event?.EventType || !event?.ProcessName) return;
    const ruleResult = evaluateRules(event);
    const behaviorResult = evaluateBehavior(event);

    const ruleScore = ruleResult.score || 0;
    const behaviorScore = behaviorResult.score || 0;

    if (ruleScore === 0 && behaviorScore === 0) return;
    const fusedScore = fuseScores(ruleScore, behaviorScore);
    if (fusedScore < MIN_ANOMALY_SCORE) return;
    const severity = calculateSeverity(fusedScore);
    const reasons = mergeReasons(
      ruleResult.reasons,
      behaviorResult.reasons
    );
    const vector = behaviorResult?.reasons?.[0]?.vector || {
      spawn: 0, net: 0, file: 0, div: 0, burst: 0, corr: 0
    };
    addToBatch(event.ProcessName, severity, vector, reasons);

  } catch (err) {
    console.error("Anomaly worker error:", err);
  }
});

setInterval(flushBatch, 300);
