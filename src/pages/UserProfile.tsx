
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Edit, Trash, Mail, Phone, MapPin, Calendar } from 'lucide-react';
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

      // Check if the response data has the correct shape
      if (response.data && typeof response.data === 'object') {
        // If response already contains user and courses properties
        if ('user' in response.data && 'courses' in response.data) {
          return response.data as UserProfileData;
        } 
        // If response is just a User object
        else {
          // Create a UserProfileData object with the User and empty courses array
          return {
            user: response.data as User,
            courses: []
          } as UserProfileData;
        }
      }
      
      throw new Error('Invalid response format from API');
    },
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
  });

  const handleDeleteUser = async () => {
    if (!userId || !userData) return;
    
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
      if (userData.user.role === Role.instructor) {
        navigate('/instructors');
      } else if (userData.user.role === Role.student) {
        navigate('/students');
      } else {
        navigate('/dashboard');
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
  const userType = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{userType} Profile</h1>
            <p className="text-muted-foreground mt-1">
              View and manage {userType.toLowerCase()} information
            </p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate(`/add-user`, { state: { userId: user.userId, role: user.role } })}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash className="h-4 w-4 mr-2" />
              Delete {userType}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={user.profilePicture?.fileUrl} alt={user.fullName} />
                      <AvatarFallback className="text-xl">{getInitials(user.fullName)}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">{user.fullName}</h2>
                    <p className="text-muted-foreground">{userType}</p>
                    
                    <div className="w-full mt-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                      
                      {user.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{user.phoneNumber}</span>
                        </div>
                      )}
                      
                      {user.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="text-sm">{user.address}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex-1">
              <Tabs defaultValue="details">
                <Card>
                  <CardHeader className="pb-1">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">{userType} Details</TabsTrigger>
                      <TabsTrigger value="credentials">Credentials</TabsTrigger>
                      <TabsTrigger value="courses">Courses</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <TabsContent value="details" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium">Full Name</h3>
                          <p className="text-muted-foreground">{user.fullName}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Email</h3>
                          <p className="text-muted-foreground">{user.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Phone Number</h3>
                          <p className="text-muted-foreground">{user.phoneNumber || 'Not provided'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Role</h3>
                          <p className="text-muted-foreground capitalize">{user.role}</p>
                        </div>
                        <div className="col-span-2">
                          <h3 className="text-sm font-medium">Address</h3>
                          <p className="text-muted-foreground">{user.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="credentials">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium">Password Reset Required</h3>
                          <p className="text-muted-foreground">{user.mustResetPassword ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium">Last Password Reset</h3>
                          <p className="text-muted-foreground">Not available</p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            toast({
                              title: "Reset Password",
                              description: "This feature is not yet implemented.",
                            });
                          }}
                        >
                          Reset Password
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="courses">
                      {courses && courses.length > 0 ? (
                        <ScrollArea className="h-[200px] w-full rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {courses.map((course) => (
                              <div 
                                key={course.courseId} 
                                className="border rounded-md p-3 cursor-pointer hover:bg-muted/50"
                                onClick={() => navigate(`/courses/${course.courseId}`)}
                              >
                                <h3 className="text-md font-semibold">{course.courseName}</h3>
                                <p className="text-sm text-muted-foreground">{course.description || 'No description'}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No courses found for this {userType.toLowerCase()}.
                        </div>
                      )}
                    </TabsContent>
                  </CardContent>
                </Card>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
