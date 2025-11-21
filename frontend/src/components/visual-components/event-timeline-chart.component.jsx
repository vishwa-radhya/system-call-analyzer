import { useState, useEffect, useRef } from "react";
import EmptyVisualization from './empty-visualization.component';
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


const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, p) => sum + p.value, 0);
    return (
      <div className="px-3 py-2 bg-white border border-gray-200 rounded shadow-lg">
        <p className="font-medium text-sm text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs text-gray-600">
            <span style={{ color: entry.color }}>●</span> {entry.name}: <span className="font-semibold text-gray-900">{entry.value}</span>
          </p>
        ))}
        <p className="text-xs text-gray-500 mt-1 pt-1 border-t border-gray-100">
          Total: <span className="font-semibold">{total}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function EventTimelineChart({
  processLogs,
  fileIOLogs,
  networkLogs
}) {
  const { buckets: initialBuckets, bucketMap: initialMap } = buildEmptyBuckets();
  const [buckets, setBuckets] = useState(initialBuckets);
  const bucketMapRef = useRef(initialMap);

  useEffect(() => {
    const { bucketMap } = buildEmptyBuckets();

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
      const { bucketMap } = buildEmptyBuckets(now);

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

  const totalEvents = buckets.reduce((sum, b) => sum + b.process + b.network + b.file, 0);

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Real-Time Event Monitor
          </h3>
          <p className="text-sm text-gray-500 mt-1">Last 30 minutes of activity</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-gray-900">
            {totalEvents.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Events</div>
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={buckets} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
            <XAxis
              dataKey="time"
              minTickGap={5}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              wrapperStyle={{ paddingBottom: 10, fontSize: '13px' }}
              iconType="line"
            />
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

      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-sm mt-1 flex-shrink-0 bg-blue-500"></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-1">Process Events</div>
            <div className="text-lg font-semibold text-gray-900">
              {buckets.reduce((sum, b) => sum + b.process, 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-sm mt-1 flex-shrink-0 bg-green-500"></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-1">Network Events</div>
            <div className="text-lg font-semibold text-gray-900">
              {buckets.reduce((sum, b) => sum + b.network, 0).toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded-sm mt-1 flex-shrink-0 bg-orange-500"></div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-1">File I/O Events</div>
            <div className="text-lg font-semibold text-gray-900">
              {buckets.reduce((sum, b) => sum + b.file, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
        <svg
          className="w-3 h-3 text-gray-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Chart updates every 5 seconds with real-time event data
      </p>
    </div>
  );
}