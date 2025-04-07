import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  link: string;
}

export function useBreadcrumbs() {
  const location = useLocation();

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentPath = '';

    // Add Dashboard as the first breadcrumb for all pages except the root
    if (pathSegments.length > 0) {
      breadcrumbs.push({ label: 'Dashboard', link: '/dashboard' });
    }

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip certain segments that shouldn't appear in breadcrumbs
      if (['add-user', 'edit'].includes(segment)) {
        return;
      }

      // Handle dynamic segments (IDs)
      if (/^\d+$/.test(segment)) {
        const prevSegment = pathSegments[index - 1];
        if (prevSegment) {
          switch (prevSegment) {
            case 'courses':
              breadcrumbs.push({ label: 'Course Details', link: currentPath });
              break;
            case 'students':
              breadcrumbs.push({ label: 'Student Profile', link: currentPath });
              break;
            case 'instructors':
              breadcrumbs.push({ label: 'Instructor Profile', link: currentPath });
              break;
            case 'users':
              breadcrumbs.push({ label: 'User Profile', link: currentPath });
              break;
            case 'batches':
              breadcrumbs.push({ label: 'Batch Details', link: currentPath });
              break;
            default:
              breadcrumbs.push({ label: 'Details', link: currentPath });
          }
        }
        return;
      }

      // Map segments to user-friendly labels
      let label = '';
      switch (segment) {
        case 'dashboard':
          // Skip adding dashboard again if it's already the first breadcrumb
          if (index === 0) return;
          label = 'Dashboard';
          break;
        case 'courses':
          label = 'Courses';
          break;
        case 'students':
          label = 'Students';
          break;
        case 'instructors':
          label = 'Instructors';
          break;
        case 'users':
          label = 'Users';
          break;
        case 'batches':
          label = 'Batches';
          break;
        case 'categories':
          label = 'Categories';
          break;
        case 'schedules':
          label = 'Schedules';
          break;
        case 'resources':
          label = 'Resources';
          break;
        case 'settings':
          label = 'Settings';
          break;
        case 'profile':
          label = 'My Profile';
          break;
        case 'add':
          const parent = pathSegments[index - 1];
          if (parent) {
            label = `Add ${parent.slice(0, -1)}`;
          } else {
            label = 'Add New';
          }
          break;
        default:
          // Skip unknown segments
          return;
      }

      breadcrumbs.push({ label, link: currentPath });
    });

    return breadcrumbs;
  }, [location.pathname]);
} 