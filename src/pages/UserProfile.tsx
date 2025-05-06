import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUser, deleteUser, updateUser } from '@/lib/api/users';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from '@/lib/types';
import { ArrowLeft, User as UserIcon, Mail, Phone, Calendar, Edit, Trash, MapPin } from 'lucide-react';
import StudentActivityPanel from '@/components/users/StudentActivityPanel';
import InstructorActivityPanel from '@/components/users/InstructorActivityPanel';
import { UserForm } from '@/components/users/UserForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PasswordTab from '@/components/users/PasswordTab';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(Number(userId)),
    enabled: !!userId,
  });

  useEffect(() => {
    if (userQuery.data?.success && userQuery.data?.data) {
      setUser(userQuery.data.data);
    } else if (userQuery.isError) {
      toast({
        title: 'Error',
        description: 'Failed to load user data',
        variant: 'destructive',
      });
    }
  }, [userQuery.data, userQuery.isError, toast]);

  const userRole = user?.role || '';
  const isStudent = userRole === 'student';
  const isInstructor = userRole === 'instructor';
  const basePath = isStudent ? '/students' : isInstructor ? '/instructors' : '/users';
  const userTypeLabel = isStudent ? 'Student' : isInstructor ? 'Instructor' : 'User';

  const handlePasswordUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  };

  const handleEditSubmit = async (formData: any) => {
    if (!user || !userId) return;
    setIsSubmitting(true);

    try {
      const response = await updateUser(user.userId, formData);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'User details updated successfully',
        });
        queryClient.invalidateQueries({
          queryKey: ['user', userId],
        });
        setIsEditDialogOpen(false);
      } else {
        throw new Error(response.error || 'Failed to update user');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    try {
      const response = await deleteUser(user.userId);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
        navigate(basePath);
      } else {
        throw new Error(response.error || 'Failed to delete user');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(basePath)}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {userTypeLabel}s
          </Button>
          <div className="flex items-center gap-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit User Details</DialogTitle>
                  <DialogDescription>
                    Make changes to the user's information here.
                  </DialogDescription>
                </DialogHeader>
                {user && (
                  <UserForm
                    onSubmit={handleEditSubmit}
                    isSubmitting={isSubmitting}
                    defaultValues={{
                      fullName: user.fullName,
                      email: user.email,
                      phoneNumber: user.phoneNumber || '',
                      address: user.address || '',
                      role: user.role,
                      password: user.password || '',
                    }}
                    isEditMode={true}
                    existingUser={user}
                  />
                )}
              </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center gap-1">
                  <Trash className="h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user's account
                    and remove their data from the system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
       
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {userQuery.isLoading ? (
            <p>Loading user data...</p>
          ) : !user ? (
            <p>User not found</p>
          ) : (
            <>
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center text-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={user.profilePicture?.fileUrl || ''} />
                      <AvatarFallback className="text-2xl bg-primary/10">
                        {user.fullName?.charAt(0) || <UserIcon className="h-12 w-12" />}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold break-words w-full">{user.fullName}</h2>
                    <Badge className="mt-2">{user.role}</Badge>
                    
                    <div className="w-full space-y-3 mt-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium break-all">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium break-all">{user.phoneNumber || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">Joined</p>
                          <p className="font-medium break-all">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium break-all">{user.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-3">
                <Tabs defaultValue="courses" className="w-full">
                  <TabsList>
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="schedules">Schedules</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                  </TabsList>

                  <TabsContent value="courses">
                    <Card>
                      <CardHeader>
                        <CardTitle>Courses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isStudent && <StudentActivityPanel userId={Number(userId)} />}
                        {isInstructor && <InstructorActivityPanel userId={Number(userId)} />}
                        {!isStudent && !isInstructor && (
                          <p>Course information is only available for students and instructors.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="schedules">
                    <Card>
                      <CardHeader>
                        <CardTitle>Upcoming Classes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isStudent && <StudentActivityPanel userId={Number(userId)} showSchedulesOnly />}
                        {isInstructor && <InstructorActivityPanel userId={Number(userId)} showSchedulesOnly />}
                        {!isStudent && !isInstructor && (
                          <p>Schedule information is only available for students and instructors.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="password">
                     <PasswordTab user={user} onUpdate={handlePasswordUpdate} />
                   </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
