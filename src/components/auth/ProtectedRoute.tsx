
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import Layout from '@/components/layout/Layout';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = () => {
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
    console.log("Not authenticated, redirecting to login from Protected Route");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If authenticated, render the outlet inside Layout
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;
