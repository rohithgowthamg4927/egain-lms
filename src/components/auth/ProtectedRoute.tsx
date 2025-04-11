
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@/lib/types';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRoles?: Role | Role[];
};

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    // Redirect to login with a return path
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Check if the route requires specific roles and user doesn't have them
  if (requiredRoles && !hasRole(requiredRoles)) {
    console.log('Access denied: User does not have the required role(s)', { 
      userRole: user?.role, 
      requiredRoles
    });
    
    // Redirect based on user's role
    if (user?.role === Role.student) {
      return <Navigate to="/student/dashboard" replace />;
    } else if (user?.role === Role.instructor) {
      return <Navigate to="/dashboard" replace />;
    }
    
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
