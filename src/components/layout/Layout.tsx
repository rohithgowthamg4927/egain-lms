import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import Header from './Header';
import BreadcrumbNav from './BreadcrumbNav';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  noHeader?: boolean;
}

const Layout = ({ children, requireAuth = true, noHeader = false }: LayoutProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Add logging to help debug
  console.log("Layout - Auth State:", { isAuthenticated, isLoading, requireAuth, path: location.pathname });

  useEffect(() => {
    // Only redirect if authentication is required, the auth check is completed, 
    // the user is not authenticated, and they're not already on the login page
    if (!isLoading && requireAuth && !isAuthenticated && location.pathname !== '/') {
      console.log("Not authenticated, redirecting to login from:", location.pathname);
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, requireAuth, location.pathname]);

  // Show loading indicator while checking auth status
  if (isLoading && requireAuth) {
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

  // For login page or when no auth is required
  if (!requireAuth || location.pathname === '/') {
    return <>{children}</>;
  }

  // For authenticated pages with sidebar layout
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!noHeader && <Header />}
        <main className="flex-1 overflow-auto">
          <div className="w-full px-6 py-6">
            <BreadcrumbNav />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
