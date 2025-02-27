
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LiveClockProps {
  className?: string;
}

const LiveClock: React.FC<LiveClockProps> = ({ className }) => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-2xl font-semibold">{formatTime(time)}</h3>
            <p className="text-sm text-gray-500">{formatDate(time)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveClock;
