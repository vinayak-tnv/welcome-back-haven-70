
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
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const isWeekendDay = date ? isWeekend(date) : false;

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
      className={`time-slot group p-3 rounded-lg border flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        isDarkMode 
          ? (isWeekendDay ? 'border-amber-700 bg-amber-900/40' : 'bg-gray-800 border-gray-700') 
          : (isWeekendDay ? 'border-amber-300 bg-amber-50' : 'bg-white')
      }`}
      onClick={handleSlotClick}
    >
      <div className="flex items-center">
        <Clock className={`h-4 w-4 ${
          isDarkMode
            ? (isWeekendDay ? 'text-amber-400' : 'text-gray-400')
            : (isWeekendDay ? 'text-amber-500' : 'text-gray-400')
        } mr-2`} />
        <span className={`text-sm font-medium ${
          isDarkMode
            ? (isWeekendDay ? 'text-amber-300' : 'text-gray-200')
            : (isWeekendDay ? 'text-amber-700' : '')
        }`}>
          {time24h}
          {isWeekendDay && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              isDarkMode ? 'bg-amber-800 text-amber-200' : 'bg-amber-200'
            }`}>
              Weekend
            </span>
          )}
        </span>
      </div>
      <ArrowRight className={`h-4 w-4 ${
        isDarkMode
          ? (isWeekendDay ? 'text-amber-500' : 'text-gray-500 group-hover:text-gray-300')
          : (isWeekendDay ? 'text-amber-400' : 'text-gray-400 group-hover:text-gray-600')
      } transition-colors`} />
    </div>
  );
};

export default TimeSlot;
