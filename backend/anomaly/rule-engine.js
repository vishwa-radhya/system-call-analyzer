import { rulesByType } from "./rules.js";

const BASE_SEVERITY = { 
  low: 2,
  medium: 5,
  high: 8,
  critical: 12
};

function evaluateCondition(event, condition) {
  const field = condition.field;
  const operator = condition.operator;
  const expected = condition.expected;

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
      return (
        typeof value === "string" &&
        value.toLowerCase().includes(String(expected).toLowerCase())
      );

    case "regex":
      return new RegExp(expected, "i").test(value || "");

    case "starts_with":
      return typeof value === "string" && value.startsWith(expected);

    default:
      return false;
  }
}

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
    // allow disabling noisy rules
    if (rule.enabled === false) continue;

    const matched =
      (typeof rule.check === "function" && rule.check(event)) ||
      (rule.conditions && evaluateConditions(event, rule.conditions));

    if (!matched) continue;

    const severityKey = (rule.severity || "medium").toLowerCase();
    const severityScore = BASE_SEVERITY[severityKey] ?? BASE_SEVERITY.medium;

    // weight is a small fine-tuning factor, e.g. -2 .. +3
    const weightedScore = severityScore + (rule.weight || 0);

    score += weightedScore;

    reasons.push({
      layer: "Rule",
      rule: rule.name,
      severity: rule.severity,
      mitre: rule.mitre || "N/A",
      score: weightedScore,
      matchedConditions: rule.conditions || null,
      reason: typeof rule.reason === "function" ? rule.reason(event) : rule.reason
    });
  }

  return { score, reasons };
}
