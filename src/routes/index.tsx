import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import Dashboard from '@/pages/Dashboard';
import Courses from '@/pages/Courses';
import CourseDetail from '@/pages/CourseDetail';
import EditCourse from '@/pages/EditCourse';
import AddCourse from '@/pages/AddCourse';
import Categories from '@/pages/Categories';
import Schedules from '@/pages/Schedules';
import Batches from '@/pages/Batches';
import BatchDetail from '@/pages/BatchDetail';
import EditBatch from '@/pages/EditBatch';
import AddBatch from '@/pages/AddBatch';
import Students from '@/pages/Students';
import Instructors from '@/pages/Instructors';
import Resources from '@/pages/Resources';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import { studentRouter } from './student';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthGuard><Outlet /></AuthGuard>,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'courses',
        element: <Courses />,
      },
      {
        path: 'courses/:courseId',
        element: <CourseDetail />,
      },
      {
        path: 'courses/:courseId/edit',
        element: <EditCourse />,
      },
      {
        path: 'courses/add',
        element: <AddCourse />,
      },
      {
        path: 'categories',
        element: <Categories />,
      },
      {
        path: 'schedules',
        element: <Schedules />,
      },
      {
        path: 'batches',
        element: <Batches />,
      },
      {
        path: 'batches/:batchId',
        element: <BatchDetail />,
      },
      {
        path: 'batches/:batchId/edit',
        element: <EditBatch />,
      },
      {
        path: 'batches/add',
        element: <AddBatch />,
      },
      {
        path: 'students',
        element: <Students />,
      },
      {
        path: 'instructors',
        element: <Instructors />,
      },
      {
        path: 'resources',
        element: <Resources />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  ...studentRouter.routes,
]); 