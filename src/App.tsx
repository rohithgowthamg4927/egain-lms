
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Batches from '@/pages/Batches';
import BatchDetail from '@/pages/BatchDetail';
import Courses from '@/pages/Courses';
import CourseDetail from '@/pages/CourseDetail';
import AddCourse from '@/pages/AddCourse';
import EditCourse from '@/pages/EditCourse';
import Instructors from '@/pages/Instructors';
import Students from '@/pages/Students';
import Resources from '@/pages/Resources';
import Schedules from '@/pages/Schedules';
import NotFound from '@/pages/NotFound';
import Profile from '@/pages/Profile';
import UserProfile from '@/pages/UserProfile';
import AddUser from '@/pages/AddUser';
import UserDetail from '@/pages/UserDetail';
import Categories from '@/pages/Categories';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/batches/:batchId" element={<BatchDetail />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/add" element={<AddCourse />} />
          <Route path="/courses/edit/:courseId" element={<EditCourse />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/students" element={<Students />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users/:userId" element={<UserProfile />} />
          <Route path="/instructors/:userId" element={<UserProfile />} />
          <Route path="/students/:userId" element={<UserProfile />} />
          <Route path="/add-user" element={<AddUser />} />
        </Route>
        
        {/* Legacy routes with redirects */}
        <Route path="/user-detail/:userId" element={<UserDetail />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
