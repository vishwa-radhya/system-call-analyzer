// anomaly-detector.js
import { rulesByType } from "./rules.js";
import { correlationRules } from "./correlation-rules.js";

const recentLogs = new Map();
const LOG_WINDOW_MS = 60 * 1000;

function updateLogStore(log) {
  const pid = log.Pid;
  if (!pid) return;

  if (!recentLogs.has(pid)) {
    recentLogs.set(pid, []);
  }
  const logArray = recentLogs.get(pid);

  logArray.push(log);

  const now = new Date(log.Timestamp).getTime();
  recentLogs.set(
    pid,
    logArray.filter(entry => new Date(entry.Timestamp).getTime() >= now - LOG_WINDOW_MS)
  );
}

export function detectAnomalies(log) {
  const type = log.EventType?.toLowerCase() || "";
  let rulesToCheck = [];

  if (type.startsWith("process")) rulesToCheck = rulesByType.process;
  else if (type.startsWith("file")) rulesToCheck = rulesByType.file;
  else if (type.startsWith("network")) rulesToCheck = rulesByType.network;

  const atomicAnomalies = rulesToCheck
    .filter(rule => {
      try {
        return rule.check(log);
      } catch (e) {
        console.error(`Rule ${rule.name} failed:`, e);
        return false;
      }
    })
    .map(rule => ({
      Anomaly: true,
      Rule: rule.name,
      Severity: rule.severity,
      Reason: rule.reason(log),
      Log: log
    }));

  // Correlation (phase 2)
  updateLogStore(log);
  const correlatedAnomalies = runCorrelationChecks(log);

  return [...correlatedAnomalies, ...atomicAnomalies];
}

function runCorrelationChecks(currentLog) {
  const pid = currentLog.Pid;
  if (!pid || !recentLogs.has(pid)) return [];

  const history = recentLogs.get(pid);

  return correlationRules
    .filter(rule => {
      try {
        return rule.check(history, currentLog);
      } catch (e) {
        console.error(`Correlation Rule ${rule.name} failed:`, e);
        return false;
      }
    })
    .map(rule => ({
      Anomaly: true,
      Rule: rule.name,
      Severity: rule.severity,
      Reason: rule.reason(currentLog),
      CorrelatedEvents: history.slice(-5).concat(currentLog)
    }));
}
