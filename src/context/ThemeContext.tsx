
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean; // Added to quickly check if dark mode is active
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for stored theme preference
    const storedTheme = localStorage.getItem('theme') as Theme;
    if (storedTheme) {
      return storedTheme;
    }
    
    // Default to light theme instead of checking system preference
    return 'light';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    let appliedTheme: 'light' | 'dark';
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      appliedTheme = systemTheme;
    } else {
      root.classList.add(theme);
      appliedTheme = theme;
    }
    
    // Update isDarkMode state
    setIsDarkMode(appliedTheme === 'dark');
    
    // Store theme preference
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes if using system preference
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      const newTheme = mediaQuery.matches ? 'dark' : 'light';
      root.classList.add(newTheme);
      setIsDarkMode(newTheme === 'dark');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
