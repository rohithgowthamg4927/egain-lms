
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

  // Add detailed logging
  useEffect(() => {
    console.log("ProtectedRoute Debug:", {
      isAuthenticated,
      isLoading,
      userRole: user?.role,
      allowedRoles,
      currentPath: location.pathname,
      hasUser: !!user
    });
  }, [isAuthenticated, isLoading, user, allowedRoles, location.pathname]);

  // While checking authentication, show a loading placeholder
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
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If no user data, redirect to login
  if (!user) {
    console.log("No user data, redirecting to login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Specific role-based access control
  if (allowedRoles && allowedRoles.length > 0) {
    // If user role is not in allowed roles, handle accordingly
    if (!allowedRoles.includes(user.role)) {
      console.log(`User role ${user.role} not allowed, redirecting to appropriate dashboard`);
      // If student trying to access admin/instructor route, redirect to student dashboard
      if (user.role === Role.student) {
        return <Navigate to="/student/dashboard" replace />;
      }
      // If admin/instructor trying to access student route, redirect to admin dashboard
      else {
        return <Navigate to="/dashboard" replace />;
      }
    }
  } else {
    // For routes without specific role restrictions, enforce separation
    const isStudentRoute = location.pathname.startsWith('/student');
    const isAdminRoute = !isStudentRoute;
    
    if (user.role === Role.student && isAdminRoute) {
      console.log("Student trying to access admin route, redirecting to student dashboard");
      return <Navigate to="/student/dashboard" replace />;
    }
    
    if (user.role !== Role.student && isStudentRoute) {
      console.log("Admin/instructor trying to access student route, redirecting to admin dashboard");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If authenticated and authorized, render the layout
  console.log("Rendering protected route with layout");
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;
