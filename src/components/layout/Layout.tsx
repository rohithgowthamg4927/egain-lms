
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';

const Layout = () => {
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Log authentication state for debugging
    console.log("Layout render - Auth State:", { isAuthenticated, path: pathname });
  }, [isAuthenticated, pathname]);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
        <Toaster />
      </main>
    </div>
  );
};

export default Layout;
