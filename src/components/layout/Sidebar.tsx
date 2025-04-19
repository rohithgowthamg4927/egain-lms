import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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

  const handleLogout = () => {
    logout();
  };

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

      {hasRole([Role.student]) && (
        <Link to="/student/courses">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              pathname === "/student/courses" && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <BookOpen className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>My Courses</span>}
          </Button>
        </Link>
      )}

      {hasRole([Role.student]) && (
        <Link to="/student/schedules">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              pathname === "/student/schedules" && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <Calendar className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>My Schedules</span>}
          </Button>
        </Link>
      )}

      {hasRole([Role.student]) && (
        <Link to="/student/resources">
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start",
              pathname === "/student/resources" && "bg-accent text-accent-foreground",
              isCollapsed && "flex h-10 w-10 p-0 justify-center"
            )}
          >
            <FileText className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>My Resources</span>}
          </Button>
        </Link>
      )}

      <Button
        variant="ghost"
        size={isCollapsed ? "icon" : "default"}
        onClick={() => setIsLogoutDialogOpen(true)}
        className={cn(
          "w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-100/50",
          isCollapsed && "flex h-10 w-10 p-0 justify-center"
        )}
      >
        <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
        {!isCollapsed && <span>Logout</span>}
      </Button>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your account and redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation menu for the application</SheetDescription>
            </SheetHeader>
            <div className="flex h-16 items-center border-b px-4">
              <a
                href="https://e-gain.co.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full"
              >
              <img
                src="/egain-logo.jpeg"
                alt="e-Gain Logo"
                className="h-10 object-contain bg-white"
              />
             </a>
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
        "flex flex-col border-r bg-sidebar shadow-sm transition-all duration-300 sticky top-0 h-screen",
        isCollapsed ? "w-[70px]" : "w-64",
        className
      )}
    >
      <div className="flex h-16 items-center border-b px-4 transition-all justify-between">
        <a
          href="https://e-gain.co.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center"
        >
          <img
            src="/egain-logo.jpeg"
            alt="e-Gain Logo"
            className={cn(isCollapsed ? "h-8" : "h-10", "object-contain bg-white")}
          />
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full border shadow-sm bg-background"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>
      <div className={cn("flex-1 overflow-y-auto p-2")}>
        <NavItems />
      </div>
    </div>
  );
}
