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

// Mock data derived from the logs you provided:
// dllhost (5 events), explorer (3 events), RuntimeBroker (1 event), helper (1 event)
const mockTopProcessesData = [
  { name: 'dllhost', count: 5, fill: '#16a34a' },         // Normal green
  { name: 'explorer', count: 3, fill: '#0ea5e9' },        // Bright blue
  { name: 'RuntimeBroker', count: 1, fill: '#f97316' },   // Bright orange
  { name: 'helper', count: 1, fill: '#a855f7' }           // Bright purple
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-xl">
          <p className="font-semibold text-lg text-gray-800">{label}</p>
          <p className="text-sm" style={{ color: item.payload.fill }}>
            Total Events: <span className="font-bold">{item.value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
};

export default function TopProcessesBarChart({ data = mockTopProcessesData, title = "Top Processes by Event Count (Mock Data)" }) {
    const [isVisible, setIsVisible] = useState(false);
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
  
  const hasAny = data.some(d => d.count > 0);
  if (!hasAny) return <EmptyVisualization />;

  const totalEvents = data.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <div 
        ref={chartRef}
        className={`p-6 bg-gradient-to-br from-white to-green-50 border border-green-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              {title}
            </h3>
            <p className="text-sm text-gray-600">Most active system processes</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          {totalEvents} total events
        </div>
      </div>
      
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            layout="vertical" 
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeOpacity={0.6} />
            
            <XAxis 
              type="number" 
              allowDecimals={false}
              tick={{ fontSize: 13, fill: '#6b7280', fontWeight: '500' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
              label={{
                value: "Total Event Count",
                position: "bottom",
                offset: 10,
                fill: '#374151',
                style: { fontWeight: 'bold', fontSize: '14px' }
              }}
            />
            
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 14, fill: '#374151', fontWeight: '500' }}
              width={150}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />

            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(243, 244, 246, 0.8)' }} 
            />

            <Bar 
              dataKey="count" 
              name="Event Count" 
              radius={[0, 8, 8, 0]} // More rounded corners
              minPointSize={5}
              isAnimationActive={isVisible}
              animationBegin={isVisible ? 0 : 1000}
              animationDuration={isVisible ? 1200 : 0}
              animationEasing="ease-out"
            >
              {
                data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill} 
                    className="transition-all duration-500 hover:brightness-110 hover:shadow-lg hover:scale-105"
                    stroke="#fff"
                    strokeWidth={2}
                    style={{
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))
              }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        {data.slice(0, 4).map((entry, index) => {
          const percentage = ((entry.count / totalEvents) * 100).toFixed(1);
          return (
            <div key={index} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: entry.fill }}></div>
                <span className="text-sm font-medium text-gray-700">{entry.name}</span>
              </div>
              <div className="text-2xl font-bold animate-pulse" style={{ color: entry.fill }}>
                {entry.count} events
              </div>
              <div className="text-xs text-gray-500">
                {percentage}% of total
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}