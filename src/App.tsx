import { TaskProvider } from './context/TaskContext';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { ToastProvider } from './hooks/use-toast';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <TaskProvider>
            <MainLayout />
          </TaskProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
