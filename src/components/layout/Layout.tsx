
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Toaster } from '@/components/ui/toaster';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';

const Layout = () => {
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs();
  const showBreadcrumbs = location.pathname !== '/';
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Listen for sidebar collapse events from localStorage or a custom event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarCollapsed') {
        setIsSidebarCollapsed(e.newValue === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    // Initialize from localStorage if available
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setIsSidebarCollapsed(savedState === 'true');
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Calculate the appropriate margin based on screen size and sidebar state
  const getMainMargin = () => {
    if (isMobile) return 'ml-0';
    if (isSidebarCollapsed) return 'ml-[70px]';
    
    // Responsive margins based on screen width
    if (windowWidth < 768) return 'ml-[180px]';
    if (windowWidth < 1024) return 'ml-[200px]';
    return 'ml-[240px]';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-4 sm:p-6 md:p-8 transition-all ${getMainMargin()}`}>
          {showBreadcrumbs && breadcrumbs.length > 0 && (
            <div className="mb-6">
              <BreadcrumbNav items={breadcrumbs} />
            </div>
          )}
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default Layout;
