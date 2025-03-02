
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Calendar, ListTodo, Bell, Settings, Search, Plus, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <h1 className="text-xl font-medium">planify.</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-4">
              <NavLink
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                Schedule
              </NavLink>
              <NavLink
                to="/tasks"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/tasks') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                Tasks
              </NavLink>
              <NavLink
                to="/focus"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/focus') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                Focus
              </NavLink>
              <NavLink
                to="/notifications"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/notifications') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                Notifications
              </NavLink>
              <NavLink
                to="/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/settings') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                Settings
              </NavLink>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 text-sm bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 w-48"
              />
            </div>
            
            {user && (
              <>
                <Button size="sm" className="hidden sm:flex items-center gap-2 bg-black text-white hover:bg-gray-800">
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full" />
                    ) : (
                      <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">Welcome back,</p>
                      <p className="text-xs text-gray-600">{user.name}</p>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => logout()}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
        
        {location.pathname === '/' && (
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{formatDate(currentDate).split(',')[0]}</h2>
              <p className="text-sm text-gray-500">Today</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
