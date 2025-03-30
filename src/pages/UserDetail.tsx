
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById } from '@/lib/api';
import { User, Course } from '@/lib/types';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Mail, Phone, MapPin, Book, CalendarClock, Shield } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface UserResponse {
  user: User;
  courses: Course[];
}

const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      
      if (!userId) {
        toast({
          title: 'Error',
          description: 'User ID is missing',
          variant: 'destructive',
        });
        navigate(-1);
        return;
      }
      
      try {
        console.log('Fetching user data for ID:', userId);
        const response = await getUserById(Number(userId));
        
        if (response.success && response.data) {
          // If the API returns user and courses in one call
          if ('user' in response.data && 'courses' in response.data) {
            const userData = response.data as UserResponse;
            setUser(userData.user);
            setCourses(userData.courses || []);
          } else {
            // If API just returns user data
            setUser(response.data as User);
            setCourses([]);
          }
        } else {
          throw new Error(response.error || 'Failed to fetch user details');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        toast({
          title: 'Error loading user',
          description: error instanceof Error ? error.message : 'Failed to load user details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, navigate, toast]);

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-2">Loading user details...</span>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-6">The user you're looking for doesn't exist or has been removed.</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBack}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">User Profile</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user?.profilePicture?.fileUrl} alt={user?.fullName} />
                  <AvatarFallback className="text-2xl">{user ? getInitials(user.fullName) : ''}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">{user?.fullName}</CardTitle>
              <div className="inline-flex items-center mt-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                
                {user?.phoneNumber && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
                    </div>
                  </div>
                )}
                
                {user?.address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">{user.address}</p>
                    </div>
                  </div>
                )}
                
                {user && (
                  <div className="flex items-start">
                    <CalendarClock className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Joined</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {user && (
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-muted-foreground mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Password Status</p>
                      <p className="text-sm text-muted-foreground">
                        {user.mustResetPassword ? 'Must reset password' : 'Password updated'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/add-user`, { state: { userId: user?.userId, role: user?.role } })}
                >
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.role === 'student' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Enrolled Courses</h3>
                    {courses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map((course) => (
                          <div key={course.courseId} className="flex items-start p-3 border rounded-md">
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                              <Book className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{course.courseName}</h4>
                              <p className="text-sm text-muted-foreground">{course.courseLevel}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Not enrolled in any courses yet.</p>
                    )}
                  </div>
                </div>
              )}
              
              {user?.role === 'instructor' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Teaching Courses</h3>
                    {courses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map((course) => (
                          <div key={course.courseId} className="flex items-start p-3 border rounded-md">
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                              <Book className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{course.courseName}</h4>
                              <p className="text-sm text-muted-foreground">{course.courseLevel}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Not teaching any courses yet.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UserDetail;
