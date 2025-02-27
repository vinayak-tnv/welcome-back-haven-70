
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '@/context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Don't show header on login page
  const showHeader = isAuthenticated || location.pathname !== '/login';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showHeader && <Header />}
      <main className="flex-1 transition-all duration-300 animate-fade-in">
        {children}
      </main>
    </div>
  );
};

export default Layout;
