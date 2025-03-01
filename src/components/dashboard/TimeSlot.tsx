
import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { TimeSlot as TimeSlotType } from '@/types';

interface TimeSlotProps {
  slot: TimeSlotType;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ slot }) => {
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

  const time24h = formatTo24h(slot.time);

  return (
    <div className="time-slot group bg-white p-3 rounded-lg border flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <Clock className="h-4 w-4 text-gray-400 mr-2" />
        <span className="text-sm font-medium">{time24h}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
    </div>
  );
};

export default TimeSlot;
