
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Login from './pages/Index';
import AddUser from './pages/AddUser';
import Students from './pages/Students';
import Instructors from './pages/Instructors';
import Courses from './pages/Courses';
import Resources from './pages/Resources';
import Schedules from './pages/Schedules';
import { AuthProvider } from './hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import UserDetail from './pages/UserDetail';

const queryClient = new QueryClient();

function App() {
  return (
    <div className="App">
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add-user" element={<AddUser />} />
              <Route path="/students" element={<Students />} />
              <Route path="/instructors" element={<Instructors />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/students/:userId" element={<UserDetail />} />
              <Route path="/instructors/:userId" element={<UserDetail />} />
            </Routes>
            <Toaster />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </div>
  );
}

export default App;
