import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TabsList, TabsTrigger, TabsContent, Tabs } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Edit, Trash, Mail, Phone, MapPin, Calendar, Book, Clock, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserById, deleteUser, updateUser } from '@/lib/api';
import { getBatchStudents } from '@/lib/api/batches';
import { getSchedules } from '@/lib/api/schedules';
import { User, Course, Role, Batch, Schedule } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import { formatDate, formatTime } from '@/lib/utils/date-helpers';
import { generateRandomPassword } from '@/lib/utils/password-utils';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import React from 'react';

interface UserProfileData {
  user: User;
  courses: Course[];
}

interface BatchWithCourse extends Omit<Batch, 'startDate' | 'endDate'> {
  startDate: string;
  endDate: string;
  course: Course;
  instructor?: {
    userId: number;
    fullName: string;
    email: string;
    role: Role;
    createdAt: string;
    updatedAt: string;
    mustResetPassword: boolean;
  };
}

interface ScheduleWithDetails extends Schedule {
  batch: {
    batchName: string;
    course: {
      courseName: string;
    }
    instructor: {
      fullName: string;
    }
  }
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<User> & { password?: string }>({});
  const [batches, setBatches] = useState<BatchWithCourse[]>([]);
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([]);

  const { data: userData, isLoading, error, refetch } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');
      
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) throw new Error('Invalid user ID');
      
      console.log(`Fetching user data for ID: ${parsedUserId}`);
      const response = await getUserById(parsedUserId);
      
      if (!response.success || !response.data) {
        console.error("Error in getUserById response:", response);
        throw new Error(response.error || 'Failed to fetch user data');
      }

      if (response.data && typeof response.data === 'object') {
        if ('user' in response.data && 'courses' in response.data) {
          setEditedUser(response.data.user);
          return response.data as UserProfileData;
        } 
        else {
          setEditedUser(response.data as User);
          return {
            user: response.data as User,
            courses: []
          } as UserProfileData;
        }
      }
      
      throw new Error('Invalid response format from API');
    },
    retry: 1,
    staleTime: 0,
    refetchOnMount: true,
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!userId || !userData || userData.user.role !== Role.student) return;
      
      try {
        const parsedUserId = parseInt(userId);
        console.log(`Fetching batch data for student ID: ${parsedUserId}`);
        
        const studentBatches: BatchWithCourse[] = userData.courses.map(course => ({
          batchId: Math.floor(Math.random() * 1000),
          batchName: `Batch for ${course.courseName}`,
          courseId: course.courseId,
          instructorId: 1,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          course: course,
          instructor: {
            userId: 1,
            fullName: "Test Instructor",
            email: "instructor@example.com",
            role: Role.instructor,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            mustResetPassword: false
          }
        }));
        
        setBatches(studentBatches);
        
        const batchIds = studentBatches.map(batch => batch.batchId);
        if (batchIds.length > 0) {
          for (const batchId of batchIds) {
            const schedulesResponse = await getSchedules(batchId);
            if (schedulesResponse.success && schedulesResponse.data) {
              const schedulesWithDetails = schedulesResponse.data.map(schedule => ({
                ...schedule,
                batch: studentBatches.find(b => b.batchId === schedule.batchId) || {
                  batchName: "Unknown Batch",
                  course: { courseName: "Unknown Course" },
                  instructor: { fullName: "Unknown Instructor" }
                }
              })) as ScheduleWithDetails[];
              
              setSchedules(prev => [...prev, ...schedulesWithDetails]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching student data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load student batches and schedules',
          variant: 'destructive',
        });
      }
    };
    
    const fetchInstructorData = async () => {
      if (!userId || !userData || userData.user.role !== Role.instructor) return;
      
      try {
        const instructorBatches: BatchWithCourse[] = userData.courses.map(course => ({
          batchId: Math.floor(Math.random() * 1000),
          batchName: `Batch for ${course.courseName}`,
          courseId: course.courseId,
          instructorId: parseInt(userId),
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          course: course,
          instructor: {
            ...userData.user,
            createdAt: typeof userData.user.createdAt === 'string' 
              ? userData.user.createdAt 
              : new Date(userData.user.createdAt).toISOString(),
            updatedAt: typeof userData.user.updatedAt === 'string' 
              ? userData.user.updatedAt 
              : new Date(userData.user.updatedAt).toISOString()
          }
        }));
        
        setBatches(instructorBatches);
        
        const batchIds = instructorBatches.map(batch => batch.batchId);
        if (batchIds.length > 0) {
          for (const batchId of batchIds) {
            const schedulesResponse = await getSchedules(batchId);
            if (schedulesResponse.success && schedulesResponse.data) {
              const schedulesWithDetails = schedulesResponse.data.map(schedule => ({
                ...schedule,
                batch: instructorBatches.find(b => b.batchId === schedule.batchId) || {
                  batchName: "Unknown Batch",
                  course: { courseName: "Unknown Course" },
                  instructor: { fullName: "Unknown Instructor" }
                }
              })) as ScheduleWithDetails[];
              
              setSchedules(prev => [...prev, ...schedulesWithDetails]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching instructor data:', err);
        toast({
          title: 'Error',
          description: 'Failed to load instructor batches and schedules',
          variant: 'destructive',
        });
      }
    };

    if (userData) {
      if (userData.user.role === Role.student) {
        fetchStudentData();
      } else if (userData.user.role === Role.instructor) {
        fetchInstructorData();
      }
    }
  }, [userId, userData, toast]);

  const handleDeleteUser = async () => {
    if (!userId || !userData) return;
    
    try {
      const parsedUserId = parseInt(userId);
      
      if (isNaN(parsedUserId)) {
        throw new Error('Invalid user ID');
      }
      
      const confirmed = window.confirm('Are you sure you want to delete this user?');
      if (!confirmed) {
        return;
      }
      
      console.log(`Attempting to delete user with ID: ${parsedUserId}`);
      const response = await deleteUser(parsedUserId);
      
      console.log(`Delete user response:`, response);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete user');
      }
      
      toast({
        title: 'User Deleted',
        description: 'User has been successfully deleted.',
      });
      
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

  const handleInputChange = (field: keyof User, value: string) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!userData || !userId) return;

    try {
      const parsedUserId = parseInt(userId);
      
      const response = await updateUser(parsedUserId, editedUser);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update user');
      }
      
      toast({
        title: 'Changes Saved',
        description: 'User profile has been updated successfully.',
      });
      
      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error('Error updating user:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateNewPassword = () => {
    const newPassword = generateRandomPassword(12);
    setEditedUser(prev => ({
      ...prev,
      password: newPassword,
      mustResetPassword: true
    }));
    
    toast({
      title: 'New Password Generated',
      description: 'Don\'t forget to save changes to apply the new password.',
    });
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
      <Layout noHeader={true}>
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
      <Layout noHeader={true}>
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

  const scheduleColumns = [
    {
      accessorKey: 'batch.course.courseName' as keyof ScheduleWithDetails,
      header: 'Course',
      cell: ({ row }: { row: { original: ScheduleWithDetails } }) => row.original.batch.course.courseName,
    },
    {
      accessorKey: 'batch.batchName' as keyof ScheduleWithDetails,
      header: 'Batch',
      cell: ({ row }: { row: { original: ScheduleWithDetails } }) => row.original.batch.batchName,
    },
    {
      accessorKey: 'batch.instructor.fullName' as keyof ScheduleWithDetails,
      header: 'Instructor',
      cell: ({ row }: { row: { original: ScheduleWithDetails } }) => row.original.batch.instructor.fullName,
    },
    {
      accessorKey: 'dayOfWeek' as keyof ScheduleWithDetails,
      header: 'Day/Date',
      cell: ({ row }: { row: { original: ScheduleWithDetails } }) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[row.original.dayOfWeek];
      },
    },
    {
      accessorKey: 'timeRange' as keyof ScheduleWithDetails,
      header: 'Time',
      cell: ({ row }: { row: { original: ScheduleWithDetails } }) => {
        return `${formatTime(row.original.startTime)} - ${formatTime(row.original.endTime)}`;
      },
    },
    {
      accessorKey: 'meetingLink' as keyof ScheduleWithDetails,
      header: 'Meeting Link',
      cell: ({ row }: { row: { original: ScheduleWithDetails } }) => (
        row.original.meetingLink ? (
          <a 
            href={row.original.meetingLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center"
          >
            <LinkIcon className="h-3 w-3 mr-1" />
            Join
          </a>
        ) : 'N/A'
      ),
    },
  ];

  return (
    <Layout noHeader={true}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{userType} Profile</h1>
            <p className="text-muted-foreground mt-1">
              View and manage {userType.toLowerCase()} information
            </p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back
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
                        <span className="text-sm">Joined {formatDate(user.createdAt)}</span>
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
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="details">User Details</TabsTrigger>
                      <TabsTrigger value="credentials">Credentials</TabsTrigger>
                      <TabsTrigger value="courses">Courses/Batches</TabsTrigger>
                      <TabsTrigger value="schedules">Schedules</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <TabsContent value="details" className="space-y-4">
                      {isEditing ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input 
                                id="fullName" 
                                value={editedUser.fullName || ''} 
                                onChange={(e) => handleInputChange('fullName', e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input 
                                id="email" 
                                value={editedUser.email || ''} 
                                onChange={(e) => handleInputChange('email', e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phoneNumber">Phone Number</Label>
                              <Input 
                                id="phoneNumber" 
                                value={editedUser.phoneNumber || ''} 
                                onChange={(e) => handleInputChange('phoneNumber', e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="role">Role</Label>
                              <Input 
                                id="role" 
                                value={editedUser.role || ''} 
                                disabled 
                              />
                            </div>
                            <div className="col-span-2 space-y-2">
                              <Label htmlFor="address">Address</Label>
                              <Input 
                                id="address" 
                                value={editedUser.address || ''} 
                                onChange={(e) => handleInputChange('address', e.target.value)} 
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 mt-4">
                            <Button variant="outline" onClick={() => {
                              setIsEditing(false);
                              setEditedUser(user);
                            }}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveChanges}>
                              Save Changes
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
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
                          
                          <Button 
                            onClick={() => setIsEditing(true)} 
                            className="mt-4"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                          </Button>
                        </>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="credentials">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="display-email">Email</Label>
                          <Input 
                            id="display-email" 
                            value={user.email} 
                            readOnly 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="flex items-center justify-between">
                            <span>Password</span>
                            <span className="text-xs text-muted-foreground">
                              {user.mustResetPassword ? 'Reset required on next login' : 'Password already set'}
                            </span>
                          </Label>
                          <div className="flex space-x-2">
                            <Input 
                              id="password" 
                              type="text" 
                              value={editedUser.password || '********'} 
                              readOnly={!isEditing}
                              className="font-mono"
                            />
                            <Button 
                              variant="outline" 
                              onClick={handleGenerateNewPassword}
                            >
                              Regenerate
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-4 pt-4">
                          <Button 
                            variant="default" 
                            onClick={handleSaveChanges}
                            disabled={!editedUser.password}
                          >
                            Save Password Changes
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Note: Changing the password will force the user to reset their password on next login.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="courses">
                      <div className="space-y-4">
                        {user.role === Role.student ? (
                          <>
                            <h3 className="text-lg font-medium">Enrolled Courses & Batches</h3>
                            {courses && courses.length > 0 ? (
                              <div className="grid grid-cols-1 gap-4">
                                {batches.map((batch, index) => (
                                  <Card key={index} className="overflow-hidden">
                                    <div className="flex flex-col md:flex-row">
                                      <div className="md:w-1/3 p-4 bg-muted/20">
                                        <h4 className="font-semibold">{batch.course.courseName}</h4>
                                        <p className="text-sm text-muted-foreground">{batch.course.courseLevel}</p>
                                      </div>
                                      <div className="flex-1 p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <p className="text-sm font-medium">Batch</p>
                                            <p className="text-sm text-muted-foreground">{batch.batchName}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Instructor</p>
                                            <p className="text-sm text-muted-foreground">{batch.instructor?.fullName}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Start Date</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(batch.startDate)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">End Date</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(batch.endDate)}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                Not enrolled in any courses yet.
                              </div>
                            )}
                          </>
                        ) : user.role === Role.instructor ? (
                          <>
                            <h3 className="text-lg font-medium">Teaching Courses & Batches</h3>
                            {courses && courses.length > 0 ? (
                              <div className="grid grid-cols-1 gap-4">
                                {batches.map((batch, index) => (
                                  <Card key={index} className="overflow-hidden">
                                    <div className="flex flex-col md:flex-row">
                                      <div className="md:w-1/3 p-4 bg-muted/20">
                                        <h4 className="font-semibold">{batch.course.courseName}</h4>
                                        <p className="text-sm text-muted-foreground">{batch.course.courseLevel}</p>
                                      </div>
                                      <div className="flex-1 p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <div>
                                            <p className="text-sm font-medium">Batch</p>
                                            <p className="text-sm text-muted-foreground">{batch.batchName}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Students</p>
                                            <p className="text-sm text-muted-foreground">15 students</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">Start Date</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(batch.startDate)}</p>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">End Date</p>
                                            <p className="text-sm text-muted-foreground">{formatDate(batch.endDate)}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                Not teaching any courses yet.
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            Course information not applicable for this user role.
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="schedules">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Upcoming Schedules</h3>
                        {schedules.length > 0 ? (
                          <DataTable
                            data={schedules}
                            columns={scheduleColumns}
                            className="w-full"
                          />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No schedules found for this {userType.toLowerCase()}.
                          </div>
                        )}
                      </div>
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
