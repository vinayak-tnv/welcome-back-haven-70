
import { TaskProvider } from './context/TaskContext';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <TaskProvider>
          <MainLayout />
          <Toaster />
        </TaskProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
