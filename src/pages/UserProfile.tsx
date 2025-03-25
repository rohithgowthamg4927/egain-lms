
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Role, User, Course, Batch } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';
import { CheckCircle, XCircle, Info, Mail, Phone, CalendarDays, BookOpen, Users, Clock, Award, Copy, Loader2, Edit, School, User as UserIcon } from 'lucide-react';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock user data - in a real app, this would be fetched from API
        const mockUser: User = {
          userId: parseInt(userId || '1'),
          fullName: 'John Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1 (555) 123-4567',
          role: parseInt(userId || '1') % 2 === 0 ? Role.instructor : Role.student,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          mustResetPassword: true,
          profilePicture: {
            pictureId: 1,
            userId: parseInt(userId || '1'),
            fileName: 'profile.jpg',
            fileUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
            fileType: 'image/jpeg',
            fileSize: 12345,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        };
        
        setUser(mockUser);
        
        // Mock enrolled courses
        const mockCourses: Course[] = [
          {
            courseId: 1,
            courseName: 'Introduction to JavaScript',
            courseLevel: 'beginner' as Level,
            categoryId: 1,
            description: 'Learn the basics of JavaScript programming language',
            thumbnailUrl: 'https://via.placeholder.com/150',
            duration: 30,
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            courseId: 2,
            courseName: 'Advanced React Techniques',
            courseLevel: 'intermediate' as Level,
            categoryId: 2,
            description: 'Master advanced React concepts',
            thumbnailUrl: 'https://via.placeholder.com/150',
            duration: 45,
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        
        setEnrolledCourses(mockCourses);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user profile',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, toast]);

  const handleEditUser = () => {
    navigate('/add-user', { state: { userId: user?.userId, role: user?.role } });
  };

  const handleResetPassword = () => {
    // In a real app, you would call an API to reset the password
    const temporaryPassword = 'yC34qQVaaPT';
    
    toast({
      title: 'Password Reset',
      description: 'Password has been reset successfully',
    });
    
    return temporaryPassword;
  };

  const copyPassword = () => {
    const password = handleResetPassword();
    navigator.clipboard.writeText(password);
    setPasswordCopied(true);
    
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <Skeleton className="h-[150px] w-[150px] rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-2">
            <Info className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-2xl font-bold">User Not Found</h2>
            <p className="text-muted-foreground">
              The user you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-card rounded-lg border p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-[150px] w-[150px] border-4 border-background">
              <AvatarImage src={user.profilePicture?.fileUrl} alt={user.fullName} />
              <AvatarFallback className="text-4xl">{getInitials(user.fullName)}</AvatarFallback>
            </Avatar>
            
            <div className="space-y-2 flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-3xl font-bold">{user.fullName}</h1>
                <Badge variant="outline" className={`font-normal ${
                  user.role === Role.student 
                    ? 'bg-blue-100 text-blue-800' 
                    : user.role === Role.instructor 
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-purple-100 text-purple-800'
                }`}>
                  {user.role === Role.student ? 'Student' : user.role === Role.instructor ? 'Instructor' : 'Admin'}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{user.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={handleEditUser}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button size="sm" variant="outline" onClick={copyPassword}>
                  {passwordCopied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {passwordCopied ? 'Copied!' : 'Reset Password'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue={user.role === Role.student ? "courses" : "overview"} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {user.role === Role.student && (
              <TabsTrigger value="courses">Enrolled Courses</TabsTrigger>
            )}
            {user.role === Role.instructor && (
              <TabsTrigger value="teaching">Teaching</TabsTrigger>
            )}
            <TabsTrigger value="login">Login Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {user.role === Role.student ? 'Courses Enrolled' : 'Courses Teaching'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{enrolledCourses.length}</span>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {user.role === Role.student ? 'Batches Joined' : 'Active Batches'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{enrolledCourses.length}</span>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {user.role === Role.student ? 'Hours of Learning' : 'Teaching Hours'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">
                      {enrolledCourses.reduce((acc, course) => acc + (course.duration || 0), 0)}
                    </span>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>User Activities</CardTitle>
                <CardDescription>
                  Recent activities and achievements of the user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Profile Created</h3>
                      <p className="text-sm text-muted-foreground">
                        User profile was created on {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {user.role === Role.student && (
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <School className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">Enrolled in First Course</h3>
                        <p className="text-sm text-muted-foreground">
                          Enrolled in {enrolledCourses[0]?.courseName || 'a course'} on {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {user.role === Role.instructor && (
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <Award className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">Started Teaching</h3>
                        <p className="text-sm text-muted-foreground">
                          Began teaching {enrolledCourses[0]?.courseName || 'a course'} on {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {user.role === Role.student && (
            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Courses</CardTitle>
                  <CardDescription>
                    Courses that {user.fullName} is currently enrolled in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {enrolledCourses.length === 0 ? (
                    <div className="text-center py-6">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <h3 className="text-lg font-medium">No Courses</h3>
                      <p className="text-muted-foreground">
                        This student is not enrolled in any courses yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrolledCourses.map((course) => (
                        <div key={course.courseId} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
                          <div className="w-full md:w-24 h-24 bg-muted rounded flex-shrink-0">
                            {course.thumbnailUrl ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.courseName}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-medium">{course.courseName}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {course.description || 'No description available'}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline" className="bg-blue-50">
                                {course.courseLevel}
                              </Badge>
                              <Badge variant="outline" className="bg-green-50">
                                {course.duration} hours
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-between items-end">
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                            
                            <Button variant="ghost" size="sm">View Course</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {user.role === Role.instructor && (
            <TabsContent value="teaching" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Teaching Courses</CardTitle>
                  <CardDescription>
                    Courses that {user.fullName} is currently teaching
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {enrolledCourses.length === 0 ? (
                    <div className="text-center py-6">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <h3 className="text-lg font-medium">No Courses</h3>
                      <p className="text-muted-foreground">
                        This instructor is not teaching any courses yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {enrolledCourses.map((course) => (
                        <div key={course.courseId} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
                          <div className="w-full md:w-24 h-24 bg-muted rounded flex-shrink-0">
                            {course.thumbnailUrl ? (
                              <img
                                src={course.thumbnailUrl}
                                alt={course.courseName}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-medium">{course.courseName}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {course.description || 'No description available'}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline" className="bg-blue-50">
                                {course.courseLevel}
                              </Badge>
                              <Badge variant="outline" className="bg-green-50">
                                {course.duration} hours
                              </Badge>
                              <Badge variant="outline" className="bg-amber-50">
                                15 students
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-between items-end">
                            <Badge variant="outline" className={course.isPublished ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                              {course.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                            
                            <Button variant="ghost" size="sm">View Course</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="login" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Login Information</CardTitle>
                <CardDescription>
                  User login details and password management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Password Status</h3>
                    <div className="flex items-center gap-2">
                      {user.mustResetPassword ? (
                        <>
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="text-red-500">Requires Reset</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="text-green-500">Active</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Password Management</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">Reset User Password</h4>
                        <p className="text-sm text-muted-foreground">
                          Generate a new temporary password for this user. They will be required to change it on their next login.
                        </p>
                      </div>
                      <Button onClick={copyPassword} className="whitespace-nowrap">
                        {passwordCopied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {passwordCopied ? 'Copied!' : 'Reset & Copy'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 flex justify-between py-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Last login:</span> {new Date().toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Account created:</span> {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UserProfile;
