import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
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

  // Generate breadcrumb items based on the current path
  const generateBreadcrumbItems = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items = pathSegments.map((segment, index) => {
      const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      return { label, link: path };
    });
    return items;
  };

  // If authenticated, render the outlet inside Layout with Sidebar
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <BreadcrumbNav items={generateBreadcrumbItems()} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProtectedRoute;
