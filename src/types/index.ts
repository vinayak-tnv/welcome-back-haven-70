
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
