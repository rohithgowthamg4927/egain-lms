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

    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip certain segments
      if (['edit', 'add'].includes(segment)) {
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
        case 'edit':
          const editParent = pathSegments[index - 1];
          if (editParent) {
            label = `Edit ${editParent.slice(0, -1)}`;
          } else {
            label = 'Edit';
          }
          break;
        default:
          label = segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      breadcrumbs.push({ label, link: currentPath });
    });

    return breadcrumbs;
  }, [location.pathname]);
} 