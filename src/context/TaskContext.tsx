import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, RecurrencePattern } from '@/types';
import { format, parseISO, addDays, addWeeks, addMonths, isSameDay } from 'date-fns';

// Mock initial data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Team meeting with design department',
    description: 'Discuss upcoming product redesign and timeline',
    time: '10:00',
    duration: '1h',
    priority: 'high',
    category: 'meeting',
    completed: false,
    date: '2023-02-27',
    recurrence: { type: 'weekly', interval: 1, daysOfWeek: [1] } // Monday meetings
  },
  {
    id: '2',
    title: 'Lunch with Sarah',
    time: '12:00',
    priority: 'low',
    category: 'personal',
    completed: false,
    date: '2023-02-27'
  },
  {
    id: '3',
    title: 'Complete quarterly report',
    time: '14:30',
    duration: '30m',
    priority: 'medium',
    category: 'work',
    completed: false,
    date: '2023-02-27'
  },
  {
    id: '4',
    title: 'Gym workout',
    time: '17:00',
    duration: '45m',
    priority: 'medium',
    category: 'health',
    completed: false,
    date: '2023-02-27',
    recurrence: { type: 'daily', interval: 1 } // Daily workout
  },
  {
    id: '5',
    title: 'Review marketing materials',
    time: '11:00',
    duration: '2h',
    priority: 'high',
    category: 'work',
    completed: true,
    date: '2023-02-25'
  },
  {
    id: '6',
    title: 'Call with investors',
    time: '15:00',
    duration: '1h',
    priority: 'high',
    category: 'meeting',
    completed: true,
    date: '2023-02-26'
  }
];

// Time tracking history types
interface TimeEntry {
  date: string;
  startTime: string;
  duration: number; // in minutes
  category: string;
  completed: boolean;
}

interface ProductivityPattern {
  mostProductiveTimeOfDay: string;
  mostProductiveDay: string;
  averageFocusSessionLength: number;
  completionRate: number;
  commonCategories: {category: string, count: number}[];
  totalTimeSpent: number; // in minutes
}

interface SleepPatternAnalysis {
  averageSleepHours: number;
  averageBedtime: string;
  averageWakeupTime: string;
  sleepQualityDistribution: {
    poor: number;
    fair: number;
    good: number;
    excellent: number;
  };
  recommendations: string[];
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  timeEntries: TimeEntry[];
  addTimeEntry: (entry: Omit<TimeEntry, 'date'>) => void;
  getProductivityPatterns: () => ProductivityPattern;
  getTasksForDate: (date: Date) => Task[];
  isWeekend: (date: Date) => boolean;
  getSleepPatterns: () => SleepPatternAnalysis;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  useEffect(() => {
    // Load tasks from localStorage if available
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      // Otherwise use mock tasks
      setTasks(mockTasks);
    }

    // Load time entries from localStorage if available
    const storedTimeEntries = localStorage.getItem('timeEntries');
    if (storedTimeEntries) {
      setTimeEntries(JSON.parse(storedTimeEntries));
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Save time entries to localStorage whenever they change
  useEffect(() => {
    if (timeEntries.length > 0) {
      localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
    }
  }, [timeEntries]);

  const addTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString()
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id ? { ...task, ...updates } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === id) {
          return { ...task, completed: !task.completed };
        }
        return task;
      })
    );
  };

  const addTimeEntry = (entry: Omit<TimeEntry, 'date'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      date: new Date().toISOString().split('T')[0],
    };
    setTimeEntries(prev => [...prev, newEntry]);
  };

  const getProductivityPatterns = (): ProductivityPattern => {
    // Default pattern if no data
    if (timeEntries.length === 0) {
      return {
        mostProductiveTimeOfDay: 'morning',
        mostProductiveDay: 'Monday',
        averageFocusSessionLength: 25,
        completionRate: 0,
        commonCategories: [],
        totalTimeSpent: 0
      };
    }

    // Analyze the time entries to find patterns
    const timeOfDayCount: Record<string, number> = { 'morning': 0, 'afternoon': 0, 'evening': 0 };
    const dayOfWeekCount: Record<string, number> = { 
      'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 
      'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0 
    };
    const categoryCount: Record<string, number> = {};
    let totalDuration = 0;
    let completedCount = 0;

    timeEntries.forEach(entry => {
      // Get time of day
      const hour = parseInt(entry.startTime.split(':')[0]);
      if (hour >= 5 && hour < 12) timeOfDayCount['morning']++;
      else if (hour >= 12 && hour < 17) timeOfDayCount['afternoon']++;
      else timeOfDayCount['evening']++;

      // Get day of week
      const date = new Date(entry.date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[date.getDay()];
      dayOfWeekCount[dayOfWeek]++;

      // Count categories
      if (entry.category) {
        categoryCount[entry.category] = (categoryCount[entry.category] || 0) + 1;
      }

      // Sum durations
      totalDuration += entry.duration;

      // Count completed entries
      if (entry.completed) completedCount++;
    });

    // Find most productive time
    const mostProductiveTimeOfDay = Object.entries(timeOfDayCount)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Find most productive day
    const mostProductiveDay = Object.entries(dayOfWeekCount)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Calculate completion rate
    const completionRate = timeEntries.length > 0 
      ? (completedCount / timeEntries.length) * 100 
      : 0;

    // Get common categories
    const commonCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Calculate average session length
    const averageFocusSessionLength = timeEntries.length > 0 
      ? totalDuration / timeEntries.length 
      : 25;

    return {
      mostProductiveTimeOfDay,
      mostProductiveDay,
      averageFocusSessionLength,
      completionRate,
      commonCategories,
      totalTimeSpent: totalDuration
    };
  };

  const getSleepPatterns = (): SleepPatternAnalysis => {
    // Default patterns if no data
    const defaultAnalysis: SleepPatternAnalysis = {
      averageSleepHours: 7.5,
      averageBedtime: '23:00',
      averageWakeupTime: '06:30',
      sleepQualityDistribution: {
        poor: 0,
        fair: 0,
        good: 0,
        excellent: 0
      },
      recommendations: [
        "Aim for 7-9 hours of sleep per night",
        "Try to maintain a consistent sleep schedule",
        "Avoid screens at least 1 hour before bedtime"
      ]
    };

    // Filter tasks with sleep schedule data
    const tasksWithSleepData = tasks.filter(task => task.sleepSchedule);
    if (tasksWithSleepData.length === 0) return defaultAnalysis;

    // Calculate average sleep hours
    let totalSleepHours = 0;
    let totalBedtimeMinutes = 0;
    let totalWakeupMinutes = 0;
    const qualityCount = { poor: 0, fair: 0, good: 0, excellent: 0 };

    tasksWithSleepData.forEach(task => {
      if (task.sleepSchedule) {
        // Calculate sleep hours
        const bedtime = task.sleepSchedule.bedtime.split(':').map(Number);
        const wakeup = task.sleepSchedule.wakeupTime.split(':').map(Number);
        
        // Convert to minutes for easier calculation
        const bedtimeMinutes = bedtime[0] * 60 + bedtime[1];
        const wakeupMinutes = wakeup[0] * 60 + wakeup[1];
        
        totalBedtimeMinutes += bedtimeMinutes;
        totalWakeupMinutes += wakeupMinutes;
        
        // Calculate sleep duration (handling overnight sleep)
        let sleepMinutes = wakeupMinutes - bedtimeMinutes;
        if (sleepMinutes < 0) sleepMinutes += 24 * 60; // Add a full day if sleeping past midnight
        
        totalSleepHours += sleepMinutes / 60;
        
        // Count sleep quality
        if (task.sleepSchedule.quality) {
          qualityCount[task.sleepSchedule.quality]++;
        }
      }
    });

    const averageSleepHours = totalSleepHours / tasksWithSleepData.length;
    
    // Calculate average bedtime and wakeup time
    const avgBedtimeMinutes = Math.round(totalBedtimeMinutes / tasksWithSleepData.length);
    const avgWakeupMinutes = Math.round(totalWakeupMinutes / tasksWithSleepData.length);
    
    const bedtimeHours = Math.floor(avgBedtimeMinutes / 60);
    const bedtimeMinutesRemainder = avgBedtimeMinutes % 60;
    const wakeupHours = Math.floor(avgWakeupMinutes / 60);
    const wakeupMinutesRemainder = avgWakeupMinutes % 60;
    
    const averageBedtime = `${bedtimeHours.toString().padStart(2, '0')}:${bedtimeMinutesRemainder.toString().padStart(2, '0')}`;
    const averageWakeupTime = `${wakeupHours.toString().padStart(2, '0')}:${wakeupMinutesRemainder.toString().padStart(2, '0')}`;

    // Generate personalized recommendations
    const recommendations = [];
    
    if (averageSleepHours < 7) {
      recommendations.push("You're averaging less than 7 hours of sleep. Consider going to bed earlier.");
    } else if (averageSleepHours > 9) {
      recommendations.push("You're sleeping more than 9 hours on average. This might indicate other health issues.");
    }
    
    const mostCommonQuality = Object.entries(qualityCount)
      .sort((a, b) => b[1] - a[1])[0][0];
      
    if (mostCommonQuality === 'poor' || mostCommonQuality === 'fair') {
      recommendations.push("Your sleep quality is frequently rated as less than good. Consider factors like room temperature, noise, or mattress quality.");
    }
    
    // Add general recommendations
    recommendations.push("Maintain a consistent sleep schedule, even on weekends");
    recommendations.push("Create a restful environment, cool, dark and quiet");
    
    return {
      averageSleepHours,
      averageBedtime,
      averageWakeupTime,
      sleepQualityDistribution: qualityCount,
      recommendations
    };
  };

  const taskOccursOnDate = (task: Task, targetDate: Date): boolean => {
    // If the task has no recurrence, it only occurs on its specified date
    if (!task.recurrence || task.recurrence.type === 'none') {
      return isSameDay(parseISO(task.date), targetDate);
    }

    const taskStartDate = parseISO(task.date);
    
    // If the target date is before the task start date, it doesn't occur
    if (targetDate < taskStartDate) {
      return false;
    }

    // If the task has an end date and the target date is after it, it doesn't occur
    if (task.recurrence.endDate && targetDate > parseISO(task.recurrence.endDate)) {
      return false;
    }

    const interval = task.recurrence.interval || 1;

    switch(task.recurrence.type) {
      case 'daily':
        // Check if the number of days between the start date and target date is divisible by the interval
        const daysDiff = Math.floor((targetDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff % interval === 0;
        
      case 'weekly':
        // Check if it's the right day of week and if the number of weeks since the start is divisible by the interval
        const weeksDiff = Math.floor((targetDate.getTime() - taskStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const isDivisible = weeksDiff % interval === 0;
        
        // Check if the specific day of week is included
        const targetDayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const isRightDayOfWeek = task.recurrence.daysOfWeek ? 
          task.recurrence.daysOfWeek.includes(targetDayOfWeek) : 
          taskStartDate.getDay() === targetDayOfWeek;
          
        return isDivisible && isRightDayOfWeek;
        
      case 'monthly':
        // Check if it's the same day of the month and if the number of months since start is divisible by interval
        if (taskStartDate.getDate() !== targetDate.getDate()) {
          return false;
        }
        
        const monthsDiff = 
          (targetDate.getFullYear() - taskStartDate.getFullYear()) * 12 + 
          targetDate.getMonth() - taskStartDate.getMonth();
          
        return monthsDiff % interval === 0;
        
      case 'custom':
        // For custom recurrences, we would need to implement specific logic based on the custom field
        // This is a placeholder for more complex recurrence patterns
        console.log('Custom recurrence not yet implemented:', task.recurrence.custom);
        return false;
        
      default:
        return false;
    }
  };

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => taskOccursOnDate(task, date));
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      addTask, 
      updateTask, 
      deleteTask, 
      toggleTaskCompletion,
      timeEntries,
      addTimeEntry,
      getProductivityPatterns,
      getTasksForDate,
      isWeekend,
      getSleepPatterns
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
