
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bed, Moon, Sun, BadgeAlert } from 'lucide-react';
import { useTasks } from '@/context/TaskContext';

const SleepAnalysis: React.FC = () => {
  const { getSleepPatterns } = useTasks();
  const sleepPatterns = getSleepPatterns();

  // Calculate color based on average sleep hours
  const getSleepQualityColor = (hours: number) => {
    if (hours < 6) return 'text-red-500';
    if (hours < 7) return 'text-amber-500';
    if (hours < 9) return 'text-green-500';
    return 'text-blue-500';
  };

  // Format quality distribution as percentages
  const getTotalQualityReports = () => {
    const { poor, fair, good, excellent } = sleepPatterns.sleepQualityDistribution;
    const total = poor + fair + good + excellent;
    return total > 0 ? total : 1; // Avoid division by zero
  };

  const getQualityPercentage = (quality: 'poor' | 'fair' | 'good' | 'excellent') => {
    const total = getTotalQualityReports();
    const count = sleepPatterns.sleepQualityDistribution[quality];
    return Math.round((count / total) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Bed className="h-5 w-5 text-indigo-500" />
          Sleep Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-indigo-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-indigo-600" />
              <p className="text-xs text-indigo-600 font-medium">Average Bedtime</p>
            </div>
            <p className="text-xl font-semibold mt-1">{sleepPatterns.averageBedtime}</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-600" />
              <p className="text-xs text-amber-600 font-medium">Average Wakeup</p>
            </div>
            <p className="text-xl font-semibold mt-1">{sleepPatterns.averageWakeupTime}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-gray-600" />
              <p className="text-xs text-gray-600 font-medium">Average Sleep Duration</p>
            </div>
            <p className={`text-lg font-semibold ${getSleepQualityColor(sleepPatterns.averageSleepHours)}`}>
              {sleepPatterns.averageSleepHours.toFixed(1)} hours
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Sleep Quality Distribution</p>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="bg-red-400" style={{ width: `${getQualityPercentage('poor')}%` }}></div>
            <div className="bg-amber-400" style={{ width: `${getQualityPercentage('fair')}%` }}></div>
            <div className="bg-green-400" style={{ width: `${getQualityPercentage('good')}%` }}></div>
            <div className="bg-blue-400" style={{ width: `${getQualityPercentage('excellent')}%` }}></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span className="flex items-center"><span className="h-2 w-2 bg-red-400 rounded-full mr-1"></span> Poor</span>
            <span className="flex items-center"><span className="h-2 w-2 bg-amber-400 rounded-full mr-1"></span> Fair</span>
            <span className="flex items-center"><span className="h-2 w-2 bg-green-400 rounded-full mr-1"></span> Good</span>
            <span className="flex items-center"><span className="h-2 w-2 bg-blue-400 rounded-full mr-1"></span> Excellent</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Recommendations</p>
          <ul className="space-y-1">
            {sleepPatterns.recommendations.slice(0, 3).map((recommendation, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start gap-1">
                <BadgeAlert className="h-3 w-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SleepAnalysis;
