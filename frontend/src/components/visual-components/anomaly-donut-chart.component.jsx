import { Fragment, useMemo, useState, useEffect, useRef } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import EmptyVisualization from './empty-visualization.component';

// Mock data to illustrate the anomaly breakdown concept.
// In a real application, the 'value' would be calculated based on detection logic.
const mockAnomalyData = [
    { name: 'Normal Events', value: 850, color: '#16a34a' }, // Normal green
    { name: 'Suspicious Events', value: 150, color: '#ef4444' }, // Bright red
];

// Custom label function to display percentage inside the donut slices
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    // Only display the label if the slice is visually significant (e.g., > 5%)
    if (percent * 100 < 5) return null; 

    return (
        <text 
            x={x} 
            y={y} 
            fill="white" 
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central" 
            className="font-bold text-sm"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// Custom tooltip for displaying count and calculated percentage on hover
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value, color } = payload[0].payload;
      const total = mockAnomalyData.reduce((sum, entry) => sum + entry.value, 0);
      const percent = ((value / total) * 100).toFixed(1);

      return (
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-xl">
          <p className="font-semibold text-lg text-gray-800" style={{ color: color }}>
            {name}
          </p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-bold">{value.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-bold">{percent}%</span>
          </p>
        </div>
      );
    }
    return null;
};


export default function AnomalyDonutChart() {
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

    const hasAny = mockAnomalyData.some(d => d.value > 0);
    if (!hasAny) return <EmptyVisualization />;
    
    const total = mockAnomalyData.reduce((sum, entry) => sum + entry.value, 0);
    const suspiciousPercentage = ((mockAnomalyData.find(d => d.name === 'Suspicious Events')?.value || 0) / total * 100).toFixed(1);
    const hasHighSuspicious = parseFloat(suspiciousPercentage) > 15;
    
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">
                            Anomaly Breakdown
                        </h3>
                        <p className="text-sm text-gray-600">Normal vs. Suspicious events</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {total.toLocaleString()} total events
                    </div>
                    {hasHighSuspicious && (
                        <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                            High Risk
                        </div>
                    )}
                </div>
            </div>
            
            <div style={{ width: "100%", height: 400 }} className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 to-transparent animate-pulse"></div>
                <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                        <Pie
                            data={mockAnomalyData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={80} 
                            outerRadius={140}
                            fill="#8884d8"
                            paddingAngle={3}
                            labelLine={false}
                            label={renderCustomizedLabel}
                            isAnimationActive={isVisible}
                            animationBegin={isVisible ? 0 : 1000}
                            animationDuration={isVisible ? 1500 : 0}
                            animationEasing="ease-out"
                        >
                            {/* Assign colors to slices */}
                            {mockAnomalyData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.color}
                                    stroke="#fff"
                                    strokeWidth={3}
                                    style={{
                                        filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                    className="hover:scale-105 transition-transform duration-300"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            layout="horizontal" 
                            verticalAlign="bottom" 
                            align="center"
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="circle"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
                {mockAnomalyData.map((entry, index) => {
                    const percentage = ((entry.value / total) * 100).toFixed(1);
                    const isSuspicious = entry.name === 'Suspicious Events';
                    return (
                        <div key={index} className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${isSuspicious ? 'bg-red-50 border-red-200 hover:shadow-lg' : 'bg-green-50 border-green-200 hover:shadow-lg'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                            </div>
                            <div className="text-3xl font-bold animate-pulse" style={{ color: entry.color }}>
                                {percentage}%
                            </div>
                            <div className="text-sm text-gray-500">
                                {entry.value.toLocaleString()} events
                            </div>
                            {isSuspicious && parseFloat(percentage) > 15 && (
                                <div className="mt-2 text-xs text-red-600 font-medium animate-bounce">
                                    ⚠️ Above normal threshold
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}