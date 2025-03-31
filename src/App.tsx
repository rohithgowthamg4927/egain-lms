import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Login from '@/components/auth/Login';
import UserProfile from './pages/UserProfile';
import Instructors from './pages/Instructors';
import AddUser from './pages/AddUser';
import UserDetail from './pages/UserDetail';
import Resources from './pages/Resources';
import Schedules from './pages/Schedules';
import NotFound from './pages/NotFound';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Role, User } from './lib/types';
import { getCurrentUser } from './lib/api';

import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Batches from './pages/Batches';
import BatchDetail from './pages/BatchDetail';
import Students from './pages/Students';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Verify with backend
          const response = await getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // If backend verification fails, log out
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const handleAuthentication = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('user', JSON.stringify(authenticatedUser));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="w-full">
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login onAuthenticated={handleAuthentication} />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute user={user}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/courses"
            element={
              <ProtectedRoute user={user}>
                <Courses />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/batches"
            element={
              <ProtectedRoute user={user}>
                <Batches />
              </ProtectedRoute>
            }
          />

          <Route
            path="/batches/:id"
            element={
              <ProtectedRoute user={user}>
                <BatchDetail />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/students"
            element={
              <ProtectedRoute user={user}>
                <Students />
              </ProtectedRoute>
            }
          />
          
          {/* Other routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user}>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          
          {/* Admin only routes */}
          <Route
            path="/instructors"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.admin]}>
                <Instructors />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/add-user"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.admin]}>
                <AddUser />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute user={user} allowedRoles={[Role.admin]}>
                <UserDetail />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/resources"
            element={
              <ProtectedRoute user={user}>
                <Resources />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/schedules"
            element={
              <ProtectedRoute user={user}>
                <Schedules />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
