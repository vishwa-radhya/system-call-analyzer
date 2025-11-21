import { parentPort } from "worker_threads";
import { evaluateRules } from "./rule-engine.js";
import { evaluateBehavior,applyScoreDecay } from "./behavior-engine.js";
import { MIN_ANOMALY_SCORE,SCORE_DECAY_INTERVAL,SCORE_DECAY_RATE,SEVERITY_THRESHOLDS } from "./config.js";

function calculateSeverity(score) {
  if (score < SEVERITY_THRESHOLDS.Low) return "Normal";
  if (score < SEVERITY_THRESHOLDS.Medium) return "Low";
  if (score < SEVERITY_THRESHOLDS.High) return "Medium";
  if (score < SEVERITY_THRESHOLDS.Critical) return "High";
  return "Critical";
}

setInterval(() => applyScoreDecay(SCORE_DECAY_RATE), SCORE_DECAY_INTERVAL);

parentPort.on("message", (event) => {
  try{
    if(!event || !event.EventType || !event.ProcessName) return;
    console.log('ruling')
    const ruleResult = evaluateRules(event);
    console.log(ruleResult)
    const behaviorResult = evaluateBehavior(event);
    const totalScore = ruleResult.score+behaviorResult.score;
    const severity = calculateSeverity(totalScore);

    if(totalScore>=MIN_ANOMALY_SCORE){
      parentPort.postMessage({
        severity,totalScore,
        reasons:[...ruleResult.reasons,...behaviorResult.reasons],
        event
      })
    }

  }catch(err){
    console.error("Anomaly worker error:",err);
  }
});
