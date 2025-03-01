
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task } from '@/types';

// Mock initial data
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Team meeting with design department',
    description: 'Discuss upcoming product redesign and timeline',
    time: '10:00 AM',
    duration: '1h',
    priority: 'high',
    category: 'meeting',
    completed: false,
    date: '2023-02-27'
  },
  {
    id: '2',
    title: 'Lunch with Sarah',
    time: '12:00 PM',
    priority: 'low',
    category: 'personal',
    completed: false,
    date: '2023-02-27'
  },
  {
    id: '3',
    title: 'Complete quarterly report',
    time: '2:30 PM',
    duration: '30m',
    priority: 'medium',
    category: 'work',
    completed: false,
    date: '2023-02-27'
  },
  {
    id: '4',
    title: 'Gym workout',
    time: '5:00 PM',
    duration: '45m',
    priority: 'medium',
    category: 'health',
    completed: false,
    date: '2023-02-27'
  },
  {
    id: '5',
    title: 'Review marketing materials',
    time: '11:00 AM',
    duration: '2h',
    priority: 'high',
    category: 'work',
    completed: true,
    date: '2023-02-25'
  },
  {
    id: '6',
    title: 'Call with investors',
    time: '3:00 PM',
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

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
  timeEntries: TimeEntry[];
  addTimeEntry: (entry: Omit<TimeEntry, 'date'>) => void;
  getProductivityPatterns: () => ProductivityPattern;
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

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      addTask, 
      updateTask, 
      deleteTask, 
      toggleTaskCompletion,
      timeEntries,
      addTimeEntry,
      getProductivityPatterns
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
