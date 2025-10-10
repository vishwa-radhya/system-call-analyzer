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

// Mock data to simulate anomaly events over time.
// This clearly shows a period of potential attack/high anomaly flagging ("Spike").
const mockAnomalyDensityData = [
  { time: '12:00', anomalies: 1 },
  { time: '12:01', anomalies: 3 },
  { time: '12:02', anomalies: 15 }, // Anomaly spike
  { time: '12:03', anomalies: 8 },
  { time: '12:04', anomalies: 2 },
  { time: '12:05', anomalies: 4 },
  { time: '12:06', anomalies: 9 },
  { time: '12:07', anomalies: 5 },
  { time: '12:08', anomalies: 1 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const anomalyCount = payload[0].value;
      return (
        <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-2xl backdrop-blur-sm transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <p className="font-bold text-lg text-gray-800">Time: {label}</p>
          </div>
          <p className="text-sm text-red-500">
            Anomalies Flagged: <span className="font-bold text-red-600 text-xl">{anomalyCount.toLocaleString()}</span>
          </p>
          {anomalyCount > 10 && (
            <div className="mt-2 text-xs text-red-600 font-medium animate-bounce">
              ⚠️ High risk detected
            </div>
          )}
        </div>
      );
    }
    return null;
};

export default function AnomalyDensityAreaChart() {
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
  
    const hasAny = mockAnomalyDensityData.some(d => d.anomalies > 0);
    if (!hasAny) return <EmptyVisualization />;

    return (
        <div 
            ref={chartRef}
            className={`p-6 bg-gradient-to-br from-white to-red-50 border border-red-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-1000 transform ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-xl">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">
                            Anomaly Density Over Time
                        </h3>
                        <p className="text-sm text-gray-600">Potential security threats detected</p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    Security Alert
                </div>
            </div>
            
            <div style={{ width: "100%", height: 400 }} className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 to-transparent animate-pulse"></div>
                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart 
                        data={mockAnomalyDensityData} 
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
                                value: "Anomaly Count",
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
                            dataKey="anomalies" 
                            stroke="#ef4444" // Bright red
                            fill="url(#anomalyGradient)" // Gradient fill
                            strokeWidth={3}
                            name="Anomaly Count"
                            dot={{ 
                                fill: '#ef4444', 
                                strokeWidth: 2, 
                                r: 4,
                                stroke: '#fff',
                                className: 'animate-pulse'
                            }}
                            activeDot={{ 
                                r: 8, 
                                stroke: '#ef4444', 
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
                            <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#fecaca" stopOpacity={0.8}/>
                                <stop offset="100%" stopColor="#fecaca" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm text-gray-700 text-center flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    This chart highlights periods of increased suspicious activity based on anomaly detection algorithms.
                </p>
            </div>
        </div>
    );
}