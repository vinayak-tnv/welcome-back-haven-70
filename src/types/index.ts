
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface RecurrencePattern {
  type: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number;
  endDate?: string;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  custom?: string; // For custom recurrence patterns
}

export interface WeekendPreference {
  treatAsWorkday: boolean; // If true, treat as a normal workday
  customHours?: string; // Optional custom hours for weekends, e.g., "10:00-14:00"
}

export interface SleepSchedule {
  bedtime: string; // 24h format time, e.g., "23:00"
  wakeupTime: string; // 24h format time, e.g., "07:00"
  quality?: 'poor' | 'fair' | 'good' | 'excellent'; // Optional quality rating
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  time: string;
  duration?: string;
  priority: 'high' | 'medium' | 'low';
  category?: 'work' | 'personal' | 'meeting' | 'health';
  completed: boolean;
  date: string;
  recurrence?: RecurrencePattern;
  weekendPreference?: WeekendPreference;
  sleepSchedule?: SleepSchedule;
}

export interface TimeSlot {
  id: string;
  time: string;
}

export interface CompletionStatus {
  completed: number;
  pending: number;
}

export interface PriorityStatus {
  high: number;
  medium: number;
  low: number;
}

export interface WeatherData {
  temp: number;
  location: string;
  condition: string;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  day: string;
  condition: string;
  temp: number;
}

// Helper function to generate hours in 24h format
export const generateHours = () => {
  const hours = [];
  for (let i = 0; i <= 23; i++) { // 0-23 hours
    hours.push({
      label: `${i.toString().padStart(2, '0')}:00`,
      value: i,
    });
  }
  return hours;
};
