
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import TimeSlot from '@/components/dashboard/TimeSlot';
import TaskCard from '@/components/dashboard/TaskCard';
import DonutChart from '@/components/charts/DonutChart';
import PriorityChart from '@/components/charts/PriorityChart';
import WeatherWidget from '@/components/WeatherWidget';
import LiveClock from '@/components/dashboard/LiveClock';
import AiChatAssistant from '@/components/dashboard/AiChatAssistant';
import { Task, TimeSlot as TimeSlotType, CompletionStatus, PriorityStatus, WeatherData } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Mock data
const timeSlots: TimeSlotType[] = [
  { id: '1', time: '9:00 AM' },
  { id: '2', time: '12:30 PM' },
  { id: '3', time: '3:00 PM' },
];

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
  }
];

const completionStatus: CompletionStatus = {
  completed: 8,
  pending: 2
};

const priorityStatus: PriorityStatus = {
  high: 3,
  medium: 4,
  low: 3
};

const weatherData: WeatherData = {
  temp: 32,
  location: 'Hyderabad',
  condition: 'sunny',
  forecast: [
    { day: 'Wed', condition: 'sunny', temp: 31 },
    { day: 'Thu', condition: 'cloudy', temp: 33 },
    { day: 'Fri', condition: 'sunny', temp: 35 },
    { day: 'Sat', condition: 'sunny', temp: 34 },
    { day: 'Sun', condition: 'cloudy', temp: 30 }
  ]
};

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('day');
  const [dashboardStats, setDashboardStats] = useState({
    completion: completionStatus,
    priority: priorityStatus
  });

  const handleToggleComplete = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          const newCompleted = !task.completed;
          
          // Show toast notification when task is completed
          if (newCompleted) {
            toast({
              title: "Task completed",
              description: `You've completed "${task.title}"!`,
            });
          }
          
          return { ...task, completed: newCompleted };
        }
        return task;
      })
    );
    
    // Update dashboard stats when task completion status changes
    updateDashboardStats();
  };
  
  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    toast({
      title: "Task deleted",
      description: `"${taskToDelete?.title}" has been removed from your schedule.`,
    });
    
    // Update dashboard stats when a task is deleted
    updateDashboardStats();
  };
  
  const updateDashboardStats = () => {
    // This would typically be more sophisticated, but for demo purposes:
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.filter(task => !task.completed).length;
    
    const high = tasks.filter(task => task.priority === 'high').length;
    const medium = tasks.filter(task => task.priority === 'medium').length;
    const low = tasks.filter(task => task.priority === 'low').length;
    
    setDashboardStats({
      completion: { completed, pending },
      priority: { high, medium, low }
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Welcome Banner */}
      {user && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full" />
                ) : (
                  <User className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-medium">Welcome back, {user.name}!</h2>
                <p className="text-sm text-gray-600">You have {tasks.filter(t => !t.completed).length} pending tasks today</p>
              </div>
            </div>
            
            {/* Live Clock */}
            <div className="hidden md:block">
              <LiveClock />
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Mobile Clock - Only visible on mobile */}
      <div className="md:hidden mb-6">
        <LiveClock />
      </div>
      
      {/* AI Suggestions */}
      <Card className="mb-8 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-amber-500 mr-2" />
            <CardTitle className="text-lg font-medium">AI Suggested Times</CardTitle>
          </div>
          <CardDescription>
            Based on your schedule and productivity patterns, these times might work best for your next task.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {timeSlots.map(slot => (
              <TimeSlot key={slot.id} slot={slot} />
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            AI suggestions are based on your past scheduling patterns and calendar availability
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tasks and Calendar Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Calendar and Tabs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-4">
                    <button className="p-1 rounded-full hover:bg-gray-100">
                      <ChevronLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <h3 className="text-lg font-medium">
                      February 27, 2023
                    </h3>
                    <button className="p-1 rounded-full hover:bg-gray-100">
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center">
                  <button className="text-sm text-gray-500 hover:text-gray-900">
                    Today
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="day" className="mb-8">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                </TabsList>
                <TabsContent value="day" className="mt-4">
                  <div className="space-y-1">
                    {Array.from({ length: 12 }).map((_, index) => {
                      const hour = index + 12;
                      return (
                        <div key={index} className="grid grid-cols-12 py-2 text-sm group hover:bg-gray-50 rounded-md">
                          <div className="col-span-1 text-right pr-4 text-gray-500">
                            {hour === 12 ? '12:00 AM' : (hour > 12 ? `${hour - 12}:00 AM` : `${hour}:00 AM`)}
                          </div>
                          <div className="col-span-11 border-l pl-4 min-h-8">
                            
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                <TabsContent value="week">
                  <div className="text-center py-8 text-gray-500">
                    Week view coming soon
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">February 27</CardTitle>
                <button className="text-xs text-gray-500 flex items-center">
                  Hide Completed
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onDeleteTask={handleDeleteTask}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats and Weather Column */}
        <div className="space-y-8">
          {/* Task Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Task Progress</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Completion Status</h4>
                <DonutChart data={dashboardStats.completion} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Task Priority</h4>
                <PriorityChart data={dashboardStats.priority} />
              </div>
            </CardContent>
          </Card>

          {/* Weather Widget */}
          <WeatherWidget weatherData={weatherData} />
        </div>
      </div>

      {/* AI Chat Assistant */}
      <AiChatAssistant />
    </div>
  );
};

export default Dashboard;
