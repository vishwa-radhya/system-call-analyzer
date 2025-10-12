import { useState, useEffect, useRef, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import EmptyVisualization from './empty-visualization.component';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const anomalyCount = payload[0].value;
    return (
      <div className="px-3 py-2 bg-white border border-gray-200 rounded shadow-lg">
        <p className="font-medium text-sm text-gray-900">{label}</p>
        <p className="text-sm text-gray-600 mt-1">
          Anomalies: <span className="font-semibold text-gray-900">{anomalyCount.toLocaleString()}</span>
        </p>
        {anomalyCount > 10 && (
          <div className="mt-1 text-xs text-red-600 font-medium">
            ⚠ High risk
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function AnomalyDensityAreaChart({ anomalies=[] }) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasAnimated, setHasAnimated] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, [hasAnimated]);

  // Transform anomaly array -> chart data (group by minute)
  const chartData = useMemo(() => {
    const countsByMinute = {};

    anomalies.forEach((a) => {
      if (!a?.Log?.Timestamp) return;
      const ts = new Date(a.Log.Timestamp);
      const label = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      countsByMinute[label] = (countsByMinute[label] || 0) + 1;
    });

    return Object.entries(countsByMinute)
      .map(([time, count]) => ({ time, anomalies: count }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [anomalies]);

  const hasAny = chartData.some((d) => d.anomalies > 0);
  if (!hasAny) return <EmptyVisualization />;

  const totalAnomalies = chartData.reduce((sum, d) => sum + d.anomalies, 0);
  const maxAnomalies = Math.max(...chartData.map(d => d.anomalies));

  return (
    <div
      ref={chartRef}
      className={`p-6 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Anomaly Timeline
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Detection frequency over time
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-gray-900">
            {totalAnomalies.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Anomalies</div>
          {maxAnomalies > 10 && (
            <div className="mt-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded">
              Alert
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />

            <XAxis
              dataKey="time"
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

            <Area
              type="monotone"
              dataKey="anomalies"
              stroke="#ef4444"
              fill="url(#anomalyGradient)"
              strokeWidth={2}
              name="Anomaly Count"
              dot={{
                fill: '#ef4444',
                strokeWidth: 2,
                r: 3,
                stroke: '#fff',
              }}
              activeDot={{
                r: 6,
                stroke: '#ef4444',
                strokeWidth: 2,
                fill: '#fff',
              }}
              isAnimationActive={isVisible}
              animationBegin={isVisible ? 0 : 1000}
              animationDuration={isVisible ? 1200 : 0}
              animationEasing="ease-out"
            />

            <defs>
              <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fecaca" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#fecaca" stopOpacity={0.05} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">Peak Activity</div>
            <div className="text-lg font-semibold text-gray-900">
              {maxAnomalies} anomalies
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">Time Range</div>
            <div className="text-lg font-semibold text-gray-900">
              {chartData.length} minutes
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">Average Rate</div>
            <div className="text-lg font-semibold text-gray-900">
              {(totalAnomalies / chartData.length).toFixed(1)}/min
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Chart displays suspicious activity patterns detected by anomaly detection algorithms
        </p>
      </div>
    </div>
  );
}