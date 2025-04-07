
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Role } from '@/lib/types';
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  Award,
  GraduationCap,
  Tag
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { pathname } = useLocation();
  const { logout, hasRole } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close the sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  // Auto-expand the sidebar when going from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
      setIsCollapsed(false);
    }
  }, [isMobile]);

  const NavItems = () => (
    <div className="group flex flex-col gap-1 py-2">
      {hasRole([Role.admin, Role.instructor, Role.student]) && (
        <Link to="/dashboard">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              pathname === "/dashboard" && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <LayoutDashboard className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Dashboard</span>}
          </Button>
        </Link>
      )}

      {hasRole([Role.admin, Role.instructor]) && (
        <Link to="/courses">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              pathname === "/courses" && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <BookOpen className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Courses</span>}
          </Button>
        </Link>
      )}
      
      {hasRole([Role.admin]) && (
        <Link to="/categories">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              pathname === "/categories" && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <Tag className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Categories</span>}
          </Button>
        </Link>
      )}

      {hasRole([Role.admin, Role.instructor]) && (
        <Link to="/batches">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              (pathname === "/batches" || pathname.startsWith("/batches/")) && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <GraduationCap className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Batches</span>}
          </Button>
        </Link>
      )}

      {hasRole([Role.admin, Role.instructor]) && (
        <Link to="/schedules">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              pathname === "/schedules" && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <Calendar className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Schedules</span>}
          </Button>
        </Link>
      )}

      {hasRole([Role.admin]) && (
        <Link to="/students">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              (pathname === "/students" || pathname.startsWith("/students/")) && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <Users className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Students</span>}
          </Button>
        </Link>
      )}

      {hasRole([Role.admin]) && (
        <Link to="/instructors">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              (pathname === "/instructors" || pathname.startsWith("/instructors/")) && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <Award className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Instructors</span>}
          </Button>
        </Link>
      )}

      {hasRole([Role.admin, Role.instructor]) && (
        <Link to="/resources">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              pathname === "/resources" && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <FileText className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Resources</span>}
          </Button>
        </Link>
      )}

      {hasRole([Role.admin]) && (
        <Link to="/settings">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              pathname === "/settings" && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <Settings className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Settings</span>}
          </Button>
        </Link>
      )}

      <Button
        variant="ghost"
        size={isCollapsed ? "icon" : "default"}
        onClick={() => logout()}
        className={cn(
          "w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-100/50",
          isCollapsed && "flex h-10 w-10 p-0 justify-center"
        )}
      >
        <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
        {!isCollapsed && <span>Logout</span>}
      </Button>
    </div>
  );

  // Mobile view with sheet
  if (isMobile) {
    return (
      <>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="absolute left-4 top-4 z-50 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="flex h-16 items-center border-b px-4">
              <div className="flex h-16 items-center border-b px-4 justify-center">
                <Link to="/dashboard" className="flex items-center justify-center w-full">
                  <img
                    src="/egain-logo.jpeg"
                    alt="e-Gain Logo"
                    className="h-10 object-contain"
                  />
                </Link>
              </div>

            </div>
            <ScrollArea className="h-[calc(100vh-4rem)] pb-10">
              <div className="px-2">
                <NavItems />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop view
  return (
    <div
      className={cn(
        "fixed top-0 left-0 z-40 flex flex-col border-r bg-sidebar shadow-sm transition-all duration-300 h-screen",
        isCollapsed ? "w-[70px]" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center justify-center border-b px-4 transition-all">
        <a
          href="https://e-gain.co.in"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center w-full" : "gap-2 font-semibold"
          )}
        >
          <img
            src="/egain-logo.jpeg"
            alt="e-Gain Logo"
            className={cn(
              "object-contain",
              isCollapsed ? "h-8" : "h-10"
            )}
          />
        </a>

        {/* Chevron Toggle Button - only show when expanded */}
        <div className={cn(isCollapsed ? "hidden" : "block")}>
          <div className="group relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full border shadow-sm bg-background"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronLeft className="h-3 w-3" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-black text-white text-xs rounded px-2 py-1">
              Collapse
            </div>
          </div>
        </div>

        {/* Chevron when sidebar is collapsed */}
        <div className={cn(!isCollapsed ? "hidden" : "block")}>
          <div className="group relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full border shadow-sm bg-background"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronRight className="h-3 w-3" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 transition-transform bg-black text-white text-xs rounded px-2 py-1">
              Expand
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-2 transition-all">
          <NavItems />
        </div>
      </ScrollArea>
    </div>
  );
}