import  { useState, useEffect, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import EmptyVisualization from "./empty-visualization.component";

const WINDOW_MINUTES = 30;
const TICK_INTERVAL_MS = 5000;
const pad = (n) => String(n).padStart(2, "0");

const bucketKeyFromDate = (date) =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

function buildEmptyBuckets(now = new Date()) {
  const buckets = [];
  const bucketMap = new Map();
  const base = new Date(now);
  base.setSeconds(0, 0);

  for (let i = WINDOW_MINUTES - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 60000);
    const key = bucketKeyFromDate(d);
    const obj = { time: key, process: 0, network: 0, file: 0 };
    buckets.push(obj);
    bucketMap.set(key, obj);
  }
  return { buckets, bucketMap };
}

export default function EventTimelineChart({processLogs = [],fileIOLogs = [],networkLogs = []}) {
  const { buckets: initialBuckets, bucketMap: initialMap } = buildEmptyBuckets();
  const [buckets, setBuckets] = useState(initialBuckets);
  const bucketMapRef = useRef(initialMap);

  useEffect(() => {
    const {  bucketMap } = buildEmptyBuckets();

    processLogs.forEach((log) => {
      if (!log?.Timestamp) return;
      const t = new Date(log.Timestamp);
      const key = bucketKeyFromDate(t);
      if (bucketMap.has(key)) {
        bucketMap.get(key).process += 1;
      }
    });

    fileIOLogs.forEach((log) => {
      if (!log?.Timestamp) return;
      const t = new Date(log.Timestamp);
      const key = bucketKeyFromDate(t);
      if (bucketMap.has(key)) {
        bucketMap.get(key).file += 1;
      }
    });

    networkLogs.forEach((log) => {
      if (!log?.Timestamp) return;
      const t = new Date(log.Timestamp);
      const key = bucketKeyFromDate(t);
      if (bucketMap.has(key)) {
        bucketMap.get(key).network += 1;
      }
    });

    bucketMapRef.current = bucketMap;
    setBuckets([...bucketMap.values()]);
  }, [processLogs, fileIOLogs, networkLogs]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const {  bucketMap } = buildEmptyBuckets(now);

      processLogs.forEach((log) => {
        if (!log?.Timestamp) return;
        const t = new Date(log.Timestamp);
        const key = bucketKeyFromDate(t);
        if (bucketMap.has(key)) bucketMap.get(key).process += 1;
      });

      fileIOLogs.forEach((log) => {
        if (!log?.Timestamp) return;
        const t = new Date(log.Timestamp);
        const key = bucketKeyFromDate(t);
        if (bucketMap.has(key)) bucketMap.get(key).file += 1;
      });

      networkLogs.forEach((log) => {
        if (!log?.Timestamp) return;
        const t = new Date(log.Timestamp);
        const key = bucketKeyFromDate(t);
        if (bucketMap.has(key)) bucketMap.get(key).network += 1;
      });

      bucketMapRef.current = bucketMap;
      setBuckets([...bucketMap.values()]);
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [processLogs, fileIOLogs, networkLogs]);

  const hasAny = buckets.some((b) => b.process + b.network + b.file > 0);
  if (!hasAny) return <EmptyVisualization />;

  return (
    <div style={{ width: "98%", height: 500, marginTop: "10px" }}>
      <h3 className="mb-5">System Event Flow Over Time (Last 30 minutes)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={buckets}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
          <XAxis
            dataKey="time"
            minTickGap={5}
            tick={{ fontSize: 12 }}
            label={{
              value: "Time (HH:mm)",
              position: "bottom",
              offset: -10,
            }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            label={{
              value: "Event Count",
              angle: -90,
              position: "insideLeft",
              offset: 10,
            }}
          />
          <Tooltip
            formatter={(value, name) => [value, name]}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Legend verticalAlign="top" wrapperStyle={{ paddingTop: 2 }} />
          <Line
            type="monotone"
            dataKey="process"
            stroke="#3b82f6"
            name="Process Events"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="network"
            stroke="#10b981"
            name="Network Events"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="file"
            stroke="#f97316"
            name="File I/O Events"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
