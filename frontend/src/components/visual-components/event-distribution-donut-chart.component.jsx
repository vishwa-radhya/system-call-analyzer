import { Fragment, useState, useEffect, useRef } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import EmptyVisualization from './empty-visualization.component';

// Mock data representing the event distribution (e.g., 55% File I/O, 30% Process, 15% Network)
const mockDistributionData = [
    { 
        name: 'File I/O Events', 
        value: 550, 
        color: '#f97316', // Bright orange
    }, 
    { 
        name: 'Process Events', 
        value: 300, 
        color: '#0ea5e9', // Bright blue
    },
    { 
        name: 'Network Events', 
        value: 150, 
        color: '#16a34a', // Normal green
    },
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
      const total = mockDistributionData.reduce((sum, entry) => sum + entry.value, 0);
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


export default function EventDistributionDonutChart() {
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

    const hasAny = mockDistributionData.some(d => d.value > 0);
    if (!hasAny) return <EmptyVisualization />;
    
    const total = mockDistributionData.reduce((sum, entry) => sum + entry.value, 0);
    
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
                            System Activity Composition
                        </h3>
                        <p className="text-sm text-gray-600">Event distribution breakdown</p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {total.toLocaleString()} total events
                </div>
            </div>
            
            <div style={{ width: "100%", height: 400 }} className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent animate-pulse"></div>
                <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                        <Pie
                            data={mockDistributionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={80} 
                            outerRadius={140}
                            fill="#8884d8"
                            paddingAngle={2}
                            labelLine={false}
                            label={renderCustomizedLabel}
                            isAnimationActive={isVisible}
                            animationBegin={isVisible ? 0 : 1000}
                            animationDuration={isVisible ? 1500 : 0}
                            animationEasing="ease-out"
                        >
                            {/* Assign colors to slices */}
                            {mockDistributionData.map((entry, index) => (
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
            
            <div className="mt-4 grid grid-cols-3 gap-4">
                {mockDistributionData.map((entry, index) => {
                    const percentage = ((entry.value / total) * 100).toFixed(1);
                    return (
                        <div key={index} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                            </div>
                            <div className="text-2xl font-bold animate-pulse" style={{ color: entry.color }}>
                                {percentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                                {entry.value.toLocaleString()} events
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}