
import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { TimeSlot as TimeSlotType } from '@/types';
import { useTasks } from '@/context/TaskContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';

interface TimeSlotProps {
  slot: TimeSlotType;
  date?: Date;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ slot, date = new Date() }) => {
  const { isWeekend } = useTasks();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isWeekendDay = date ? isWeekend(date) : false;
  const isDark = theme === 'dark';

  // Convert 12h time format to 24h if needed
  const formatTo24h = (timeString: string): string => {
    // If it's already in 24h format (no AM/PM suffix), return as is
    if (!timeString.includes('AM') && !timeString.includes('PM')) {
      return timeString;
    }
    
    // Split the time string into time and AM/PM parts
    const [time, modifier] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    
    // Convert hours to 24h format
    if (hours === '12') {
      hours = modifier === 'AM' ? '00' : '12';
    } else if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    
    // Ensure hours has two digits
    if (hours.length === 1) {
      hours = `0${hours}`;
    }
    
    return `${hours}:${minutes}`;
  };

  // Display time in 24h format
  const time24h = formatTo24h(slot.time);

  const handleSlotClick = () => {
    // Navigate to the tasks page with the time parameter
    const timeParam = encodeURIComponent(time24h);
    navigate(`/tasks?time=${timeParam}`);
  };

  return (
    <div 
      className={`time-slot group ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} p-3 rounded-lg border ${
        isDark ? 'border-gray-700' : ''
      } ${
        isWeekendDay 
          ? isDark 
            ? 'border-amber-700 bg-amber-900/50' 
            : 'border-amber-300 bg-amber-50'
          : isDark 
            ? 'border-gray-700' 
            : ''
      } flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
      onClick={handleSlotClick}
    >
      <div className="flex items-center">
        <Clock className={`h-4 w-4 ${
          isWeekendDay 
            ? isDark 
              ? 'text-amber-400' 
              : 'text-amber-500' 
            : isDark 
              ? 'text-gray-400' 
              : 'text-gray-400'
        } mr-2`} />
        <span className={`text-sm font-medium ${
          isWeekendDay 
            ? isDark 
              ? 'text-amber-400' 
              : 'text-amber-700' 
            : isDark 
              ? 'text-gray-300' 
              : ''
        }`}>
          {time24h}
          {isWeekendDay && (
            <span className={`ml-2 text-xs ${
              isDark 
                ? 'bg-amber-800/50 text-amber-300' 
                : 'bg-amber-200 text-amber-800'
            } px-1.5 py-0.5 rounded-full`}>
              Weekend
            </span>
          )}
        </span>
      </div>
      <ArrowRight className={`h-4 w-4 ${
        isWeekendDay 
          ? isDark 
            ? 'text-amber-600' 
            : 'text-amber-400' 
          : isDark 
            ? 'text-gray-500' 
            : 'text-gray-400'
      } group-hover:${
        isDark 
          ? 'text-gray-300' 
          : 'text-gray-600'
      } transition-colors`} />
    </div>
  );
};

export default TimeSlot;
