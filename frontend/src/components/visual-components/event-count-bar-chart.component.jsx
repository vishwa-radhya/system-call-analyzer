import { useMemo, useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell, 
} from 'recharts';
import EmptyVisualization from './empty-visualization.component';

export default function EventCountBarChart({
  processCount = 0,
  fileIOCount = 0,
  networkCount = 0
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

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, [hasAnimated]);

  // 🔹 now using counts directly
  const data = useMemo(() => [
    { name: 'Process Events', count: processCount, color: '#3b82f6' },
    { name: 'File I/O Events', count: fileIOCount, color: '#8b5cf6' },
    { name: 'Network Events', count: networkCount, color: '#06b6d4' },
  ], [processCount, fileIOCount, networkCount]);

  const hasAny = data.some(d => d.count > 0);
  if (!hasAny) return <EmptyVisualization />;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="px-3 py-2 bg-white border border-gray-200 rounded shadow-lg">
          <p className="font-medium text-sm text-gray-900">{label}</p>
          <p className="text-sm text-gray-600 mt-1">
            Count: <span className="font-semibold text-gray-900">{item.value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const totalEvents = data.reduce((sum, entry) => sum + entry.count, 0);

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
            Event Distribution Overview
          </h3>
          <p className="text-sm text-gray-500 mt-1">Total events by type</p>
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
          <BarChart 
            data={data} 
            margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
            layout="vertical" 
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal vertical={false} />
            
            <XAxis 
              type="number" 
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={false}
            />
            
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 13, fill: '#374151' }}
              width={130}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(243, 244, 246, 0.5)' }}
            />

            <Bar 
              dataKey="count" 
              name="Event Count" 
              radius={[0, 4, 4, 0]}
              minPointSize={5}
              isAnimationActive={isVisible}
              animationBegin={isVisible ? 0 : 1000}
              animationDuration={isVisible ? 1000 : 0}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
        {data.map((entry, index) => {
          const percentage = ((entry.count / totalEvents) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-sm mt-1 flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-1">{entry.name}</div>
                <div className="text-lg font-semibold text-gray-900">
                  {entry.count.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  {percentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
