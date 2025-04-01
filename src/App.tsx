
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './components/ui/theme-provider';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ServerStatusCheck from './components/auth/ServerStatusCheck';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Courses from './pages/Courses';
import Students from './pages/Students';
import Instructors from './pages/Instructors';
import Batches from './pages/Batches';
import BatchDetail from './pages/BatchDetail';
import Schedules from './pages/Schedules';
import Resources from './pages/Resources';
import AddUser from './pages/AddUser';
import UserDetail from './pages/UserDetail';
import UserProfile from './pages/UserProfile';

import './App.css';

// Create a new QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  useEffect(() => {
    // Check for dark mode preference
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <ServerStatusCheck>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<ProtectedRoute children={[]} />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="profile" element={<Profile />} />
                <Route path="courses" element={<Courses />} />
                <Route path="students" element={<Students />} />
                <Route path="students/:userId" element={<UserProfile />} />
                <Route path="instructors" element={<Instructors />} />
                <Route path="instructors/:userId" element={<UserProfile />} />
                <Route path="users/:userId" element={<UserProfile />} />
                <Route path="user/:userId" element={<UserDetail />} />
                <Route path="batches" element={<Batches />} />
                <Route path="batches/:batchId" element={<BatchDetail />} />
                <Route path="schedules" element={<Schedules />} />
                <Route path="resources" element={<Resources />} />
                <Route path="add-user" element={<AddUser />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </ServerStatusCheck>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
