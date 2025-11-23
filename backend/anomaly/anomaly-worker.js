import { parentPort } from "worker_threads";
import { evaluateRules } from "./rule-engine.js";
import { evaluateBehavior, applyScoreDecay } from "./behavior-engine.js";
import { 
  MIN_ANOMALY_SCORE, 
  SCORE_DECAY_INTERVAL, 
  SCORE_DECAY_RATE, 
  SEVERITY_THRESHOLDS 
} from "./config.js";

// ----------- FINAL SEVERITY MAPPING -------------
function calculateSeverity(score) {
  if (score < SEVERITY_THRESHOLDS.Low)      return "Normal";
  if (score < SEVERITY_THRESHOLDS.Medium)   return "Low";
  if (score < SEVERITY_THRESHOLDS.High)     return "Medium";
  if (score < SEVERITY_THRESHOLDS.Critical) return "High";
  return "Critical";
}

// ---------- NORMALIZATION + WEIGHTED FUSION ------
function fuseScores(ruleScore, behaviorScore) {
  // weights — can be tuned later
  const RULE_WEIGHT = 0.6;
  const BEHAV_WEIGHT = 0.4;

  // ensure ratio stays within 0–100 scale
  const finalScore = 
      (ruleScore * RULE_WEIGHT) + 
      (behaviorScore * BEHAV_WEIGHT);

  return Math.min(100, Math.floor(finalScore));
}

// ----------- MERGE & SORT REASONS ---------------
function mergeReasons(ruleReasons, behReasons) {
  const merged = [...ruleReasons, ...behReasons];

  // Sort: highest score reason first
  merged.sort((a, b) => (b.score || 0) - (a.score || 0));

  return merged;
}

// ----------- PERIODIC DECAY ----------------------
setInterval(() => applyScoreDecay(SCORE_DECAY_RATE), SCORE_DECAY_INTERVAL);


// =================================================
//                MAIN EVENT HANDLER
// =================================================
parentPort.on("message", (event) => {
  try {
    if (!event || !event.EventType || !event.ProcessName) return;

    // run engines
    const ruleResult = evaluateRules(event);
    console.log('rr:',ruleResult)
    const behaviorResult = evaluateBehavior(event);
    console.log('br:',behaviorResult)
    // fusion
    const fusedScore = fuseScores(ruleResult.score, behaviorResult.score);
    const severity   = calculateSeverity(fusedScore);

    const reasons = mergeReasons(ruleResult.reasons, behaviorResult.reasons);

    // only emit if exceeding threshold
    if (fusedScore >= MIN_ANOMALY_SCORE) {
      parentPort.postMessage({
        severity,
        finalScore: fusedScore,
        ruleScore: ruleResult.score,
        behaviorScore: behaviorResult.score,
        reasons,
        event
      });
    }

  } catch (err) {
    console.error("Anomaly worker error:", err);
  }
});
