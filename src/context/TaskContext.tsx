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

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompletion: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Load tasks from localStorage if available
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    } else {
      // Otherwise use mock tasks
      setTasks(mockTasks);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

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

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, toggleTaskCompletion }}>
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
