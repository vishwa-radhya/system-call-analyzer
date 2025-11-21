// anomaly/config.js
export const MIN_ANOMALY_SCORE = 40;
export const SCORE_DECAY_INTERVAL = 10_000; // ms
export const SCORE_DECAY_RATE = 5;

export const SEVERITY_THRESHOLDS = {
  Normal: 0,
  Low: 40,
  Medium: 70,
  High: 100,
  Critical: 150
};
