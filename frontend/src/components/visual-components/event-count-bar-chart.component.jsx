import {  useMemo } from 'react';
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
  processLogs,
  fileIOLogs,
  networkLogs
}) {
  const data = useMemo(() => {
    const processCount = processLogs.length;
    const fileIOCount = fileIOLogs.length;
    const networkCount = networkLogs.length;

    return [
      { 
        name: 'Process Events', 
        count: processCount, 
        color: '#3b82f6', // Tailwind blue-500 
      },
      { 
        name: 'File I/O Events', 
        count: fileIOCount, 
        color: '#f97316', // Tailwind orange-500 
      },
      { 
        name: 'Network Events', 
        count: networkCount, 
        color: '#10b981', // Tailwind emerald-500 
      },
    ];
  }, [processLogs, fileIOLogs, networkLogs]);

  const hasAny = data.some(d => d.count > 0);
  if (!hasAny) return <EmptyVisualization />;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-xl">
          <p className="font-semibold text-lg text-gray-800">{label}</p>
          <p className="text-sm" style={{ color: item.color }}>
            Total Count: <span className="font-bold">{item.value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-white">
      <h3 className="text-xl font-bold mb-6 text-gray-800">
        Total Event Counts by Type
      </h3>
      
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            layout="vertical" 
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" />
            
            <XAxis 
              type="number" 
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              label={{
                value: "Total Event Count",
                position: "bottom",
                offset: -10,
                fill: '#4b5563',
                style: { fontWeight: 'bold' }
              }}
            />
            
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fontSize: 14, fill: '#374151' }}
              width={100}
            />

            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(243, 244, 246, 0.8)' }} // Light grey overlay for hover
            />

            <Bar 
              dataKey="count" 
              name="Event Count" 
              radius={[5, 5, 0, 0]} // Rounded top corners
              minPointSize={5} 
            >
              {
                data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    className="transition-all duration-300 hover:brightness-110"
                  />
                ))
              }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <p className="mt-4 text-sm text-gray-500 text-center">
        This visualization represents the total accumulated count of each event type since data collection began.
      </p>
    </div>
  );
}
