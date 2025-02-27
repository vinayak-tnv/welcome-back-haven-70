
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CompletionStatus } from '@/types';

interface DonutChartProps {
  data: CompletionStatus;
}

const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const total = data.completed + data.pending;
    const completedPercentage = Math.round((data.completed / total) * 100);
    const pendingPercentage = 100 - completedPercentage;
    
    return [
      { name: 'Completed', value: data.completed, percentage: completedPercentage },
      { name: 'Pending', value: data.pending, percentage: pendingPercentage }
    ];
  }, [data]);

  const COLORS = ['#4ade80', '#f87171'];

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
        <h3 className="text-lg font-semibold">Completion Status</h3>
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#4ade80] mr-2"></div>
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#f87171] mr-2"></div>
            <span className="text-sm">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
