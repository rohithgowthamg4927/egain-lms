
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Lock, LogOut } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PasswordChangeForm from '@/components/users/PasswordChangeForm';

const Header = () => {
  const { user, logout } = useAuth();
  const [notifications] = useState<{ id: number; title: string; description: string }[]>([
    { id: 1, title: 'New course added', description: 'React Fundamentals course was added' },
    { id: 2, title: 'New batch starting', description: 'Flutter for Beginners batch starts next week' },
  ]);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const openPasswordDialog = () => {
    setIsPasswordDialogOpen(true);
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-card/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex-1">
          <h1 className="text-2xl font-medium text-foreground">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer">
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profilePicture?.fileUrl || user?.photoUrl} />
                  <AvatarFallback>{getInitials(user?.fullName || '')}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={openPasswordDialog} className="cursor-pointer">
                <Lock className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password below.
            </DialogDescription>
          </DialogHeader>
          <PasswordChangeForm userId={user?.userId || 0} onSuccess={() => setIsPasswordDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
};

function getPageTitle(): string {
  const path = window.location.pathname;
  
  if (path.includes('/dashboard')) return 'Dashboard';
  if (path.includes('/courses')) return 'Courses';
  if (path.includes('/batches')) return 'Batches';
  if (path.includes('/students')) return 'Students';
  if (path.includes('/instructors')) return 'Instructors';
  if (path.includes('/profile')) return 'My Profile';
  
  // Default title
  return 'LMS Admin';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export default Header;
