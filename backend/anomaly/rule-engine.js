import { rulesByType } from './rules.js';

// severity -> numerical weight mapping (can be tuned later)
const SEVERITY_SCORES = {
  low: 10,
  medium: 25,
  high: 40,
  critical: 60
};

export function evaluateRules(event) {
  const reasons = [];
  let score = 0;

  try {
    const { EventType } = event;
    const type = inferType(EventType);
    if (!type || !rulesByType[type]) return { score, reasons };

    for (const rule of rulesByType[type]) {
      if (rule.check(event)) {
        const ruleScore = SEVERITY_SCORES[rule.severity.toLowerCase()] || 20;
        score += ruleScore;
        reasons.push({
          layer: "Rule",
          rule: rule.name,
          score: ruleScore,
          severity: rule.severity,
          reason: rule.reason(event)
        });
      }
    }
  } catch (err) {
    console.error("Rule engine error:", err);
  }

  return { score, reasons };
}

function inferType(eventType = "") {
  if (eventType.startsWith("Process")) return "process";
  if (eventType.startsWith("File")) return "file";
  if (eventType.startsWith("Network")) return "network";
  return null;
}
