
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Edit, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserById, deleteUser } from '@/lib/api';
import { User, Course, Role } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface UserProfileData {
  user: User;
  courses: Course[];
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: userData, isLoading, error, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');
      
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) throw new Error('Invalid user ID');
      
      console.log(`Fetching user data for ID: ${parsedUserId}`);
      const response = await getUserById(parsedUserId);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch user data');
      }
      
      return response.data;
    },
    retry: 2, // Increase retry attempts
    staleTime: 0, // Don't cache data
    refetchOnMount: true, // Always refetch when component mounts
  });

  const handleDeleteUser = async () => {
    if (!userId) return;
    
    try {
      const parsedUserId = parseInt(userId);
      
      if (isNaN(parsedUserId)) {
        throw new Error('Invalid user ID');
      }
      
      // Show a confirmation dialog
      const confirmed = window.confirm('Are you sure you want to delete this user?');
      if (!confirmed) {
        return; // If the user cancels, do nothing
      }
      
      const response = await deleteUser(parsedUserId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete user');
      }
      
      toast({
        title: 'User Deleted',
        description: 'User has been successfully deleted.',
      });
      
      // Redirect based on the user's role
      if (userData?.user.role === Role.instructor) {
        navigate('/instructors');
      } else if (userData?.user.role === Role.student) {
        navigate('/students');
      } else {
        navigate('/users');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  // Add manual retry button for better UX
  const handleRetry = () => {
    refetch();
    toast({
      title: 'Retrying',
      description: 'Attempting to fetch user data again...',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Loading user profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !userData) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold">Error Loading Profile</h1>
          <p className="text-muted-foreground">{error instanceof Error ? error.message : 'User data not found'}</p>
          <div className="flex gap-2">
            <Button onClick={handleRetry} variant="outline">Retry</Button>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const { user, courses } = userData;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Profile</h1>
            <p className="text-muted-foreground mt-1">
              View and manage user information
            </p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate(`/add-user`, { state: { userId: user.userId } })}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash className="h-4 w-4 mr-2" />
              Delete User
            </Button>
          </div>
        </div>

        <Separator />

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Details about the user's personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profilePicture?.fileUrl} alt={user.fullName} />
                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">{user.fullName}</h2>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium">Role:</span>
                <p className="text-muted-foreground">{user.role}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Phone Number:</span>
                <p className="text-muted-foreground">{user.phoneNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Joined:</span>
                <p className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium">Bio:</span>
              <p className="text-muted-foreground">{user.bio || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {courses && courses.length > 0 && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Courses</CardTitle>
              <CardDescription>
                {user.role === 'instructor' ? 'Courses this instructor teaches' : 'Courses the user is enrolled in'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-md border">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-3">
                  {courses.map((course) => (
                    <div 
                      key={course.courseId} 
                      className="border rounded-md p-3 cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/courses/${course.courseId}`)}
                    >
                      <h3 className="text-md font-semibold">{course.courseName}</h3>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default UserProfile;
