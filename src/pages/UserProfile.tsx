
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { getUserById, deleteUser, enrollStudentToBatch, unenrollStudentFromBatch } from '@/lib/api';
import { User, Role, Course } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import { ArrowLeft, Mail, Phone, Trash, Edit, Calendar, BookOpen, Check, X } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';

interface UserProfileData {
  user: User;
  courses: Course[];
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        if (!userId) return;

        console.log(`Fetching user with ID: ${userId}`);
        const response = await getUserById(parseInt(userId));
        
        if (response.success && response.data) {
          console.log('User data retrieved:', response.data);
          setUser(response.data.user);
          setCourses(response.data.courses || []);
        } else {
          console.error('Failed to fetch user:', response.error);
          toast({
            title: 'Error',
            description: response.error || 'Failed to fetch user data',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleDelete = async () => {
    try {
      if (!user) return;
      
      const response = await deleteUser(user.userId);
      
      if (response.success) {
        toast({
          title: 'User Deleted',
          description: `${user.fullName} has been deleted successfully`,
        });
        navigate(-1);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete user',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = () => {
    if (!user) return;
    navigate('/add-user', { state: { userId: user.userId, role: user.role } });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">User Profile</h1>
        </div>

        {isLoading ? (
          <div className="grid place-items-center h-[60vh]">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
              <p className="text-muted-foreground">Loading user profile...</p>
            </div>
          </div>
        ) : !user ? (
          <div className="grid place-items-center h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold">User Not Found</h2>
              <p className="text-muted-foreground mb-4">The requested user does not exist or you don't have permission to view it.</p>
              <Button onClick={handleBack}>Go Back</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="col-span-1">
                <CardHeader className="flex flex-col items-center text-center">
                  <div className="mt-2 mb-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user.profilePicture?.fileUrl || user.photoUrl} alt={user.fullName} />
                      <AvatarFallback className="text-2xl">{getInitials(user.fullName)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-xl">{user.fullName}</CardTitle>
                  <CardDescription className="capitalize">{user.role.toLowerCase()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                    {user.phoneNumber && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="pt-4 space-y-2">
                      <Button onClick={handleEdit} className="w-full">
                        <Edit className="h-4 w-4 mr-2" /> Edit Profile
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            <Trash className="h-4 w-4 mr-2" /> Delete User
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete {user.fullName}'s
                              account and remove all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="col-span-1 md:col-span-2">
                <Tabs defaultValue="courses">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  <TabsContent value="courses">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {user.role === Role.student ? 'Enrolled Courses' : 'Teaching Courses'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {courses.length === 0 ? (
                          <div className="text-center py-6">
                            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">
                              {user.role === Role.student 
                                ? 'Not enrolled in any courses yet'
                                : 'Not teaching any courses yet'}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {courses.map((course) => (
                              <div key={course.courseId} className="flex justify-between items-center p-3 border rounded-lg">
                                <div>
                                  <h4 className="font-medium">{course.courseName}</h4>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {course.courseLevel.toLowerCase()} • {course.category?.categoryName}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => navigate(`/courses/${course.courseId}`)}>
                                    View
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="activity">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-6">
                          <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No recent activity available</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default UserProfile;
