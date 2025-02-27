
import React from 'react';
import { 
  Sun, Cloud, CloudRain, CloudSnow, Wind
} from 'lucide-react';
import { WeatherData } from '@/types';

interface WeatherWidgetProps {
  weatherData: WeatherData;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weatherData }) => {
  const getConditionIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun className="h-6 w-6 text-amber-400" />;
      case 'cloudy':
        return <Cloud className="h-6 w-6 text-gray-400" />;
      case 'rainy':
        return <CloudRain className="h-6 w-6 text-blue-400" />;
      case 'snowy':
        return <CloudSnow className="h-6 w-6 text-blue-200" />;
      default:
        return <Sun className="h-6 w-6 text-amber-400" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-4xl font-bold">{weatherData.temp}°</h3>
            <p className="text-gray-300 mt-1">{weatherData.location}</p>
          </div>
          <div className="flex items-center">
            {getConditionIcon(weatherData.condition)}
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-5 gap-2">
          {weatherData.forecast.map((day, index) => (
            <div key={index} className="text-center">
              <p className="text-xs uppercase text-gray-400">{day.day}</p>
              <div className="my-2 flex justify-center">
                {getConditionIcon(day.condition)}
              </div>
              <p className="text-sm">{day.temp}°</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
