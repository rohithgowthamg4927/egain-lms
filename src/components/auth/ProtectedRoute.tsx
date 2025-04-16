import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Loader2 } from 'lucide-react';
import { Role } from '@/lib/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h2 className="mt-4 text-xl font-medium">Loading...</h2>
          <p className="text-sm text-muted-foreground">Please wait while we load your data</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If no user data, redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Strict role-based access control
  if (allowedRoles && allowedRoles.length > 0) {
    // If user role is not in allowed roles, handle accordingly
    if (!allowedRoles.includes(user.role)) {
      
      // If student trying to access admin/instructor route, redirect to student dashboard
      if (user.role === Role.student) {
        return <Navigate to="/student/dashboard" replace />;
      }
      // If instructor trying to access admin route, redirect to instructor dashboard
      else if (user.role === Role.instructor) {
        return <Navigate to="/instructor/dashboard" replace />;
      }
      // Admin can access all routes, so no need to redirect
    }
  }

  // For routes without specific role restrictions, enforce separation
  const isStudentRoute = location.pathname.startsWith('/student');
  const isInstructorRoute = location.pathname.startsWith('/instructor');
  const isAdminRoute = !isStudentRoute && !isInstructorRoute;
  
  if (user.role === Role.student && !isStudentRoute) {
    return <Navigate to="/student/dashboard" replace />;
  }
  
  if (user.role === Role.instructor && isStudentRoute) {
    return <Navigate to="/instructor/dashboard" replace />;
  }
  
  if (user.role === Role.instructor && isAdminRoute) {
    const allowedInstructorPaths = [
      '/courses', 
      '/batches',
      '/schedules',
      '/resources',
    ];
    
    // Check if current path starts with any allowed path
    const isAllowedPath = allowedInstructorPaths.some(path => 
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
    
    // Some admin routes are allowed for instructors, but only as specified in App.tsx
    // For those we let the allowedRoles check handle access control
    if (!isAllowedPath) {
      return <Navigate to="/instructor/dashboard" replace />;
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;
