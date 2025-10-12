import { parentPort } from "worker_threads";
import { detectAnomalies } from "./anomaly-detector.js";

parentPort.on("message", (log) => {
  try {
    const anomalies = detectAnomalies(log);
    if (anomalies.length) {
      parentPort.postMessage({ anomalies });
    }
  } catch (err) {
    parentPort.postMessage({ error: err.message });
  }
});
