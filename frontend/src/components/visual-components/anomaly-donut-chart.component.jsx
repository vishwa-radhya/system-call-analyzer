import { useState, useEffect, useRef, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import EmptyVisualization from './empty-visualization.component';

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  if (percent * 100 < 5) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="font-semibold text-sm"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload;
    const percent = ((value / total) * 100).toFixed(1);

    return (
      <div className="px-3 py-2 bg-white border border-gray-200 rounded shadow-lg">
        <p className="font-medium text-sm text-gray-900">{name}</p>
        <p className="text-sm text-gray-600 mt-1">
          Events: <span className="font-semibold text-gray-900">{value.toLocaleString()}</span>
        </p>
        <p className="text-sm text-gray-600">
          Share: <span className="font-semibold text-gray-900">{percent}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function AnomalyDonutChart({ 
  processCount, fileIOCount, networkCount, anomalyCount 
}) {
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
    if (chartRef.current) observer.observe(chartRef.current);
    return () => {
      if (chartRef.current) observer.unobserve(chartRef.current);
    };
  }, [hasAnimated]);

  // compute data dynamically
  const data = useMemo(() => {
    const totalEvents = processCount + fileIOCount + networkCount;
    const normalEvents = Math.max(totalEvents - anomalyCount, 0);

    return [
      { name: 'Normal Events', value: normalEvents, color: '#10b981' },
      { name: 'Suspicious Events', value: anomalyCount, color: '#ef4444' },
    ];
  }, [processCount, fileIOCount, networkCount, anomalyCount]);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <EmptyVisualization />;

  const suspiciousPercentage = ((data[1].value / total) * 100).toFixed(1);
  const hasHighSuspicious = parseFloat(suspiciousPercentage) > 15;

  return (
    <div
      ref={chartRef}
      className={`p-6 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Security Analysis</h3>
          <p className="text-sm text-gray-500 mt-1">Normal vs. suspicious events</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-gray-900">
            {total.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Events</div>
          {hasHighSuspicious && (
            <div className="mt-1 px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded">
              High Risk
            </div>
          )}
        </div>
      </div>

      {/* Donut Chart */}
      <div style={{ width: '100%', height: 320 }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={120}
              paddingAngle={2}
              labelLine={false}
              label={renderCustomizedLabel}
              isAnimationActive={isVisible}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip total={total} />} />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center" 
              iconType="circle"
              wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Breakdown Cards */}
      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
        {data.map((entry, i) => {
          const percentage = ((entry.value / total) * 100).toFixed(1);
          const isSuspicious = entry.name === 'Suspicious Events';
          return (
            <div
              key={i}
              className="flex items-start gap-3"
            >
              <div 
                className="w-3 h-3 rounded-full mt-1 flex-shrink-0" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">{entry.name}</div>
                <div className="text-lg font-semibold text-gray-900">
                  {entry.value.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  {percentage}% of total
                </div>
                {/* {isSuspicious && parseFloat(percentage) > 15 && (
                  <div className="mt-2 text-xs text-red-600 font-medium">
                    ⚠ Above threshold
                  </div>
                )} */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}