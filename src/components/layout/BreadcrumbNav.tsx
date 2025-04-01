
import { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

const BreadcrumbNav = () => {
  const location = useLocation();
  
  const breadcrumbs = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // Create breadcrumb items from path segments
    const items = pathSegments.map((segment, index) => {
      const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
      const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      // Last item is current page
      const isLast = index === pathSegments.length - 1;
      
      return {
        title,
        url,
        isLast,
      };
    });
    
    return items;
  }, [location.pathname]);
  
  // Don't render breadcrumbs on home page or login page
  if (location.pathname === '/' || location.pathname === '/login') {
    return null;
  }
  
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard">
              <Home className="h-4 w-4 mr-1" />
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
        
        {breadcrumbs.map((crumb, index) => (
          <BreadcrumbItem key={crumb.url}>
            {crumb.isLast ? (
              <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={crumb.url}>{crumb.title}</Link>
              </BreadcrumbLink>
            )}
            
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNav;
