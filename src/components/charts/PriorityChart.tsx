
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { PriorityStatus } from '@/types';

interface PriorityChartProps {
  data: PriorityStatus;
}

const PriorityChart: React.FC<PriorityChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const total = data.high + data.medium + data.low;
    
    return [
      { name: 'High', value: data.high, percentage: Math.round((data.high / total) * 100) },
      { name: 'Medium', value: data.medium, percentage: Math.round((data.medium / total) * 100) },
      { name: 'Low', value: data.low, percentage: Math.round((data.low / total) * 100) }
    ];
  }, [data]);

  const COLORS = ['#ff6b6b', '#ffd166', '#63e6be'];

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center mt-4">
        <h3 className="text-lg font-semibold">Task Priority</h3>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#ff6b6b] mr-2"></div>
            <span className="text-sm">High</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#ffd166] mr-2"></div>
            <span className="text-sm">Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#63e6be] mr-2"></div>
            <span className="text-sm">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityChart;
