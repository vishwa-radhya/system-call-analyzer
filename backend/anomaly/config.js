// anomaly/config.js
export const MIN_ANOMALY_SCORE = 3;

export const SCORE_DECAY_INTERVAL = 10_000;
export const SCORE_DECAY_RATE = 1;

export const SEVERITY_THRESHOLDS = { 
  Low: 2,
  Medium: 5,
  High: 8,
  Critical: 10
};
