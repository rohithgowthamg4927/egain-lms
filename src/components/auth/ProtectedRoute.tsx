
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Role, User } from '@/lib/types';

interface ProtectedRouteProps {
  user: User | null;
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  user, 
  children, 
  allowedRoles 
}) => {
  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and user doesn't have one of them
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to home page or access denied page
    return <Navigate to="/" replace />;
  }

  // If all checks pass, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute;
