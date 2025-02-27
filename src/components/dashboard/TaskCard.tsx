
import React from 'react';
import { Clock, Briefcase, User, Activity } from 'lucide-react';
import { Task } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleComplete }) => {
  const getCategoryIcon = () => {
    switch (task.category) {
      case 'work':
        return <Briefcase className="h-4 w-4" />;
      case 'personal':
        return <User className="h-4 w-4" />;
      case 'health':
        return <Activity className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'text-priority-high bg-red-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`relative p-4 mb-3 rounded-lg border bg-white shadow-sm ${task.completed ? 'opacity-70' : ''} task-priority-${task.priority}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Checkbox 
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={() => onToggleComplete(task.id)}
            className="mt-1"
          />
          <div>
            <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1">{task.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <div className="time-chip bg-gray-100 text-gray-600">
                <Clock className="h-3 w-3 mr-1" />
                {task.time}
                {task.duration && ` · ${task.duration}`}
              </div>
              {task.category && (
                <div className="time-chip bg-gray-100 text-gray-600">
                  {getCategoryIcon()}
                  <span className="ml-1 capitalize">{task.category}</span>
                </div>
              )}
              <div className={`time-chip ${getPriorityColor()}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
