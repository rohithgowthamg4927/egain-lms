
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout/Layout';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Add logging to help debug
  useEffect(() => {
    console.log("ProtectedRoute render - Auth State:", { 
      isAuthenticated, isLoading, path: location.pathname 
    });
  }, [isAuthenticated, isLoading, location.pathname]);

  // While checking authentication, show a loading placeholder
  if (isLoading) {
    return (
      <Layout requireAuth={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login from Protected Route");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated, render the child routes within the Layout
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;
