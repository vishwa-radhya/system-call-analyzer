import { useState, useEffect, useRef } from 'react';
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

// Mock data to simulate event density over time.
// This clearly shows a period of high activity ("peak").
const mockDensityData = [
  { time: '12:00', events: 10 },
  { time: '12:01', events: 15 },
  { time: '12:02', events: 35 }, // Peak activity minute
  { time: '12:03', events: 20 },
  { time: '12:04', events: 8 },
  { time: '12:05', events: 12 },
  { time: '12:06', events: 25 },
  { time: '12:07', events: 18 },
  { time: '12:08', events: 6 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const eventCount = payload[0].value;
      return (
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-2xl backdrop-blur-sm transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="font-bold text-lg text-gray-800">Time: {label}</p>
          </div>
          <p className="text-sm text-blue-500">
            Total Events: <span className="font-bold text-blue-600 text-xl">{eventCount.toLocaleString()}</span>
          </p>
          {eventCount > 25 && (
            <div className="mt-2 text-xs text-blue-600 font-medium animate-bounce">
              📈 Peak activity detected
            </div>
          )}
        </div>
      );
    }
    return null;
};

export default function EventDensityAreaChart() {
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
  
    const hasAny = mockDensityData.some(d => d.events > 0);
    if (!hasAny) return <EmptyVisualization />;

    const totalEvents = mockDensityData.reduce((sum, d) => sum + d.events, 0);
    const maxEvents = Math.max(...mockDensityData.map(d => d.events));
    const hasHighActivity = maxEvents > 25;

    return (
        <div 
            ref={chartRef}
            className={`p-6 bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-1000 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">
                            Event Density Over Time
                        </h3>
                        <p className="text-sm text-gray-600">System activity volume analysis</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {totalEvents} total events
                    </div>
                    {hasHighActivity && (
                        <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                            Peak Activity
                        </div>
                    )}
                </div>
            </div>
            
            <div style={{ width: "100%", height: 400 }} className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent animate-pulse"></div>
                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart 
                        data={mockDensityData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" strokeOpacity={0.6} />
                        
                        <XAxis 
                            dataKey="time" 
                            tick={{ fontSize: 13, fill: '#6b7280', fontWeight: '500' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={{ stroke: '#e5e7eb' }}
                            label={{
                                value: "Time",
                                position: "bottom",
                                offset: 10,
                                fill: '#374151',
                                style: { fontWeight: 'bold', fontSize: '14px' }
                            }}
                        />
                        
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 13, fill: '#374151', fontWeight: '500' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={{ stroke: '#e5e7eb' }}
                            label={{
                                value: "Event Count",
                                angle: -90,
                                position: "insideLeft",
                                offset: 15,
                                fill: '#374151',
                                style: { fontWeight: 'bold', fontSize: '14px' }
                            }}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        <Area 
                            type="monotone" 
                            dataKey="events" 
                            stroke="#0ea5e9" // Bright blue
                            fill="url(#eventGradient)" // Gradient fill
                            strokeWidth={3}
                            name="Event Count"
                            dot={{ 
                                fill: '#0ea5e9', 
                                strokeWidth: 2, 
                                r: 4,
                                stroke: '#fff',
                                className: 'animate-pulse'
                            }}
                            activeDot={{ 
                                r: 8, 
                                stroke: '#0ea5e9', 
                                strokeWidth: 3, 
                                fill: '#fff',
                                className: 'animate-bounce'
                            }}
                            isAnimationActive={isVisible}
                            animationBegin={isVisible ? 0 : 1000}
                            animationDuration={isVisible ? 1500 : 0}
                            animationEasing="ease-out"
                        />
                        
                        <defs>
                            <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#bae6fd" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#bae6fd" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-gray-700 text-center flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    The chart visualizes system activity volume per time bucket to highlight peak periods and usage patterns.
                </p>
            </div>
        </div>
    );
}