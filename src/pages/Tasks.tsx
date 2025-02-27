
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, ArrowUpDown, Clock, X } from 'lucide-react';
import TaskCard from '@/components/dashboard/TaskCard';
import DonutChart from '@/components/charts/DonutChart';
import PriorityChart from '@/components/charts/PriorityChart';
import { Task, CompletionStatus, PriorityStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';
import AiChatSuggestions from '@/components/dashboard/AiChatSuggestions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

// Mock data
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

const completionStatus: CompletionStatus = {
  completed: 12,
  pending: 8
};

const priorityStatus: PriorityStatus = {
  high: 7,
  medium: 8,
  low: 5
};

const Tasks = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    time: '',
    duration: '',
    priority: 'medium',
    category: 'work',
    date: new Date().toISOString().split('T')[0]
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
  };
  
  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    toast({
      title: "Task deleted",
      description: `"${taskToDelete?.title}" has been removed from your task list.`,
    });
  };

  const handleNewTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Task title required",
        description: "Please enter a title for your new task.",
        variant: "destructive"
      });
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      time: newTask.time || '12:00 PM',
      duration: newTask.duration,
      priority: newTask.priority as 'high' | 'medium' | 'low',
      category: newTask.category as 'work' | 'personal' | 'meeting' | 'health',
      completed: false,
      date: newTask.date
    };

    setTasks(prev => [task, ...prev]);
    setNewTaskOpen(false);
    setNewTask({
      title: '',
      description: '',
      time: '',
      duration: '',
      priority: 'medium',
      category: 'work',
      date: new Date().toISOString().split('T')[0]
    });

    toast({
      title: "Task added",
      description: `"${task.title}" has been added to your task list.`,
    });
  };

  const filteredTasks = tasks.filter(task => {
    // Filter by status
    if (activeStatus === 'pending' && task.completed) return false;
    if (activeStatus === 'completed' && !task.completed) return false;
    
    // Filter by search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tasks</h1>
        <p className="text-gray-600">Manage and organize all your tasks</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tasks..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
              
              <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-black text-white hover:bg-gray-800">
                    <Plus className="h-4 w-4" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add the details of your new task below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Task title"
                        value={newTask.title}
                        onChange={handleNewTaskChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        name="description"
                        placeholder="Brief description"
                        value={newTask.description}
                        onChange={handleNewTaskChange}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          name="time"
                          placeholder="12:00 PM"
                          value={newTask.time}
                          onChange={handleNewTaskChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (Optional)</Label>
                        <Input
                          id="duration"
                          name="duration"
                          placeholder="1h"
                          value={newTask.duration}
                          onChange={handleNewTaskChange}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value) => handleSelectChange('priority', value)}
                        >
                          <SelectTrigger id="priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newTask.category}
                          onValueChange={(value) => handleSelectChange('category', value)}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        name="date"
                        type="date"
                        value={newTask.date}
                        onChange={handleNewTaskChange}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setNewTaskOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddTask}>Add Task</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Task Tabs */}
          <Tabs defaultValue="all" onValueChange={(value) => setActiveStatus(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              {filteredTasks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No tasks found</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              {filteredTasks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No pending tasks</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              {filteredTasks.length > 0 ? (
                <div className="space-y-2">
                  {filteredTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onDeleteTask={handleDeleteTask}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No completed tasks</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Stats Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Task Summary</CardTitle>
              <CardDescription>Your task completion statistics</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Completion Status</h4>
                <DonutChart data={completionStatus} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Priority Distribution</h4>
                <PriorityChart data={priorityStatus} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Quick Add</CardTitle>
              <CardDescription>Create a new task quickly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input 
                  placeholder="Task title" 
                  value={newTask.title}
                  name="title"
                  onChange={handleNewTaskChange}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => handleSelectChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newTask.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleAddTask}>Add Task</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Chat Assistant */}
      <AiChatSuggestions />
    </div>
  );
};

export default Tasks;
