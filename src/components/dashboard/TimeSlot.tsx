
import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { TimeSlot as TimeSlotType } from '@/types';

interface TimeSlotProps {
  slot: TimeSlotType;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ slot }) => {
  return (
    <div className="time-slot group">
      <div className="flex items-center">
        <Clock className="h-4 w-4 text-gray-400 mr-2" />
        <span className="text-sm font-medium">{slot.time}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
    </div>
  );
};

export default TimeSlot;
