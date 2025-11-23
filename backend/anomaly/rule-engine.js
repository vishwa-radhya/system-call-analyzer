import { rulesByType } from "./rules.js";

// Base severity scores
const BASE_SEVERITY = {
  low: 10,
  medium: 25,
  high: 40,
  critical: 60  
};

function evaluateCondition(event, condition) {
  const [field, operator, expected] = [
    condition.field,
    condition.operator,
    condition.expected
  ];

  // Support nested fields like Extra.RemoteAddress
  const value = field.includes(".")
    ? field.split(".").reduce((obj, key) => obj?.[key], event)
    : event[field];

  switch (operator) {
    case "equals":
      return value === expected;

    case "in":
      return Array.isArray(expected) && expected.includes(value);

    case "not_in":
      return Array.isArray(expected) && !expected.includes(value);

    case "contains":
      return typeof value === "string" && value.toLowerCase().includes(String(expected).toLowerCase());

    case "regex":
      return new RegExp(expected, "i").test(value || "");

    case "starts_with":
      return typeof value === "string" && value.startsWith(expected);

    default:
      return false;
  }
}

/* ----------------------------------------
   AND / OR Condition Handler for Rules
-----------------------------------------*/
function evaluateConditions(event, conditions = {}) {
  if (conditions.all) {
    return conditions.all.every(c => evaluateCondition(event, c));
  }
  if (conditions.any) {
    return conditions.any.some(c => evaluateCondition(event, c));
  }
  return false;
}

function inferType(eventType = "") {
  if (eventType.startsWith("Process")) return "process";
  if (eventType.startsWith("File")) return "file";
  if (eventType.startsWith("Network")) return "network";
  return null;
}

export function evaluateRules(event) {
  const reasons = [];
  let score = 0;

  const type = inferType(event.EventType);
  if (!type || !rulesByType[type]) return { score, reasons };

  for (const rule of rulesByType[type]) {
    const matched =
      (rule.check && rule.check(event)) ||
      evaluateConditions(event, rule.conditions);

    if (!matched) continue;

    const severityScore = BASE_SEVERITY[rule.severity.toLowerCase()] || 20;
    const weightedScore = severityScore + (rule.weight || 0);

    score += weightedScore;

    reasons.push({
      layer: "Rule",
      rule: rule.name,
      severity: rule.severity,
      mitre: rule.mitre || "N/A",
      score: weightedScore,
      matchedConditions: rule.conditions || null,
      reason: rule.reason(event)
    });
  }

  return { score, reasons };
}
