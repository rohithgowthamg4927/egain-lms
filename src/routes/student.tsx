
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentCourses from '@/pages/student/StudentCourses';
import StudentSchedules from '@/pages/student/StudentSchedules';
import StudentResources from '@/pages/student/StudentResources';
import StudentCourseDetail from '@/pages/student/StudentCourseDetail';
import NotFound from '@/pages/NotFound';

const StudentRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'student') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const studentRouter = createBrowserRouter([
  {
    path: '/student',
    element: <StudentRouteGuard><Outlet /></StudentRouteGuard>,
    children: [
      {
        path: 'dashboard',
        element: <StudentDashboard />,
      },
      {
        path: 'courses',
        element: <StudentCourses />,
      },
      {
        path: 'courses/:courseId',
        element: <StudentCourseDetail />,
      },
      {
        path: 'schedules',
        element: <StudentSchedules />,
      },
      {
        path: 'resources',
        element: <StudentResources />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]); 
