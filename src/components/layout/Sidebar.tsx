import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@/lib/types';
import { BookOpen, Calendar, LayoutDashboard, Lightbulb, Users, Settings, Menu, X, Compass, ChevronRight, GraduationCap, SlidersHorizontal } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  submenu?: NavItem[];
  roles?: Role[];
}

const Sidebar = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: [Role.ADMIN, Role.INSTRUCTOR],
    },
    {
      title: 'Courses',
      href: '/courses',
      icon: <BookOpen className="h-5 w-5" />,
      roles: [Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
    },
    {
      title: 'Batches',
      href: '/batches',
      icon: <Calendar className="h-5 w-5" />,
      roles: [Role.ADMIN, Role.INSTRUCTOR],
    },
    {
      title: 'Students',
      href: '/students',
      icon: <GraduationCap className="h-5 w-5" />,
      roles: [Role.ADMIN, Role.INSTRUCTOR],
    },
    {
      title: 'Instructors',
      href: '/instructors',
      icon: <Lightbulb className="h-5 w-5" />,
      roles: [Role.ADMIN],
    },
    {
      title: 'Resources',
      href: '/resources',
      icon: <Compass className="h-5 w-5" />,
      roles: [Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT],
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
      roles: [Role.ADMIN],
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return hasRole(item.roles);
  });

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-40 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform border-r bg-sidebar transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className={cn(
          "flex h-16 items-center border-b px-6",
          isCollapsed && "justify-center px-0"
        )}>
          <div className="flex items-center">
            <div className="rounded-md bg-primary p-1.5">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <span className="ml-2 text-xl font-semibold tracking-tight">
                EduLMS
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-3.5 hidden lg:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronRight className={cn(
              "h-5 w-5 transition-transform",
              isCollapsed ? "rotate-180" : ""
            )} />
          </Button>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center px-0"
                )
              }
            >
              <div className={cn("flex items-center", isCollapsed && "flex-col")}>
                {item.icon}
                {!isCollapsed && <span className="ml-3">{item.title}</span>}
                {isCollapsed && <span className="mt-1 text-[10px]">{item.title}</span>}
              </div>
            </NavLink>
          ))}
        </nav>

        <div className={cn(
          "absolute bottom-0 left-0 right-0 border-t p-4",
          isCollapsed && "flex justify-center p-2"
        )}>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start",
              isCollapsed && "justify-center"
            )} 
            onClick={() => window.location.href = '/profile'}
          >
            <SlidersHorizontal className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Preferences</span>}
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
