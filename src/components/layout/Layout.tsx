import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Toaster } from '@/components/ui/toaster';

const Layout = () => {
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs();
  const showBreadcrumbs = location.pathname !== '/';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
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
