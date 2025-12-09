// anomaly-worker.js
import { parentPort } from "worker_threads";
import { evaluateRules } from "./rule-engine.js";
import { evaluateBehavior, applyScoreDecay } from "./behavior-engine-25.js"; 
import {
  MIN_ANOMALY_SCORE,
  SCORE_DECAY_INTERVAL,
  SCORE_DECAY_RATE,
  SEVERITY_THRESHOLDS
} from "./config.js";


// ==========================================================
//  SEVERITY MAPPING (0–12 scale)
// ==========================================================
function calculateSeverity(score) {
  if (score <= SEVERITY_THRESHOLDS.Low)     return "Normal";
  if (score <= SEVERITY_THRESHOLDS.Medium)  return "Low";
  if (score <= SEVERITY_THRESHOLDS.High)    return "Medium";
  if (score <= SEVERITY_THRESHOLDS.Critical)return "High";
  return "Critical";
}


// ==========================================================
//  SCORE FUSION — SIMPLE, INTERPRETABLE (0–12)
// ==========================================================
function fuseScores(ruleScore, behaviorScore) {
  const raw = ruleScore + behaviorScore;
  return Math.min(12, Math.floor(raw));
}


// ==========================================================
//  REASON MERGING (sorted by score desc)
// ==========================================================
function mergeReasons(ruleReasons, behReasons) {
  const merged = [...(ruleReasons || []), ...(behReasons || [])];

  merged.sort((a, b) => (b.score || 0) - (a.score || 0));

  return merged;
}


// ==========================================================
//  PERIODIC BEHAVIOR DECAY
// ==========================================================
setInterval(() => applyScoreDecay(SCORE_DECAY_RATE), SCORE_DECAY_INTERVAL);


// ==========================================================
//  MAIN WORKER HANDLER
// ==========================================================
parentPort.on("message", (event) => {
  try {
    // guard
    if (!event?.EventType || !event?.ProcessName) return;

    // ---------------------------------------------
    // 1. Run detection engines
    // ---------------------------------------------
    const ruleResult = evaluateRules(event);
    // console.log('rr:',ruleResult)
    const behaviorResult = evaluateBehavior(event);
    // console.log('br:',behaviorResult)
    const ruleScore = ruleResult.score || 0;
    const behaviorScore = behaviorResult.score || 0;

    // ---------------------------------------------
    // 2. Fuse scores into unified anomaly score
    // ---------------------------------------------
    const fusedScore = fuseScores(ruleScore, behaviorScore);

    // ---------------------------------------------
    // 3. Determine severity
    // ---------------------------------------------
    const severity = calculateSeverity(fusedScore);

    // ---------------------------------------------
    // 4. Aggregate explanations
    // ---------------------------------------------
    const reasons = mergeReasons(
      ruleResult.reasons,
      behaviorResult.reasons
    );
    // console.log('fs:',fusedScore,'severity:',severity)
    // console.log('reasons:',reasons)
    // ---------------------------------------------
    // 5. Emit anomaly (only if meaningful)
    // ---------------------------------------------
    if (fusedScore >= MIN_ANOMALY_SCORE) {
      parentPort.postMessage({
        timestamp: new Date().toISOString(),

        severity,
        finalScore: fusedScore,

        ruleScore,
        behaviorScore,

        reasons,
        event
      });
    }

  } catch (err) {
    console.error("Anomaly worker error:", err);
  }
});
