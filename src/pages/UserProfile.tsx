
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getUsers, updateUser } from '@/lib/api';
import { getAllSchedules } from '@/lib/api/schedules';
import { User, Role, Schedule } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Clock, Edit, User as UserIcon, ChevronLeft, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { getInitials } from '@/lib/utils';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [batchSchedules, setBatchSchedules] = useState<Schedule[]>([]);
  const [instructorBatch, setInstructorBatch] = useState<{ batchId: number; batchName: string } | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<{ batchId: number; batchName: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      
      if (!userId) {
        toast({
          title: 'Error',
          description: 'User ID is missing',
          variant: 'destructive',
        });
        navigate('/users');
        return;
      }
      
      try {
        const response = await getUsers(undefined, parseInt(userId));
        
        if (response.success && response.data && response.data.length > 0) {
          const userData = response.data[0];
          setUser(userData);
          setFullName(userData.fullName);
          setEmail(userData.email);
          setPhoneNumber(userData.phoneNumber || '');
          setBio(userData.bio || '');
          
          if (userData.role === Role.instructor) {
            setInstructorBatch({ batchId: 1, batchName: 'Sample Batch' });
          }
        } else {
          toast({
            title: 'Error',
            description: response.error || 'Failed to fetch user details',
            variant: 'destructive',
          });
          navigate('/users');
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
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
  }, [userId, navigate, toast]);

  useEffect(() => {
    const fetchUserSchedules = async () => {
      if (!user || user.role !== Role.instructor || !instructorBatch) return;
      
      try {
        const schedulesResponse = await getAllSchedules({ batchId: instructorBatch.batchId });
        
        if (schedulesResponse.success && schedulesResponse.data) {
          setSchedules(schedulesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
      }
    };
    
    if (instructorBatch) {
      fetchUserSchedules();
    }
  }, [instructorBatch, user]);

  useEffect(() => {
    if (user?.role === Role.student) {
      setSelectedBatch({ batchId: 2, batchName: 'Another Batch' });
    }
  }, [user]);

  useEffect(() => {
    const fetchBatchSchedules = async () => {
      if (!selectedBatch) return;
      
      try {
        const response = await getAllSchedules({ batchId: selectedBatch.batchId });
        
        if (response.success && response.data) {
          setBatchSchedules(response.data);
        }
      } catch (error) {
        console.error('Error fetching batch schedules:', error);
      }
    };
    
    fetchBatchSchedules();
  }, [selectedBatch]);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const response = await updateUser(user.userId, {
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber,
        bio: bio,
      });
      
      if (response.success && response.data) {
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
        });
        setUser(response.data);
        setIsEditing(false);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phoneNumber || '');
    setBio(user?.bio || '');
  };

  const handleGoBack = () => {
    if (user?.role === Role.student) {
      navigate('/students');
    } else if (user?.role === Role.instructor) {
      navigate('/instructors');
    } else {
      navigate('/users');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">User not found</h2>
        <p className="text-gray-500 mt-2">The user you're looking for doesn't exist or has been removed.</p>
        <Button onClick={handleGoBack} variant="outline" className="mt-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{user.fullName}</h1>
          <Badge className="ml-2">{user.role}</Badge>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700">
              Save
            </Button>
          </div>
        ) : (
          <Button onClick={handleEditProfile} className="bg-blue-600 hover:bg-blue-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md border-blue-100 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{user.fullName}</h3>
                  <p className="text-gray-500 mt-1">Email: {user.email}</p>
                  {user.phoneNumber && (
                    <p className="text-gray-500">Phone: {user.phoneNumber}</p>
                  )}
                  {user.bio && (
                    <>
                      <Separator className="my-4" />
                      <p className="text-gray-600">{user.bio}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoUrl} />
                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
              </Avatar>
              <span>Profile Picture</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-medium">{user.fullName}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">{user.phoneNumber || 'No phone number'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {user.role === Role.instructor && instructorBatch ? (
        <Tabs defaultValue="schedules" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="schedules" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Schedules for {instructorBatch.batchName}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="schedules" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Class Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium">No schedules found</h3>
                    <p className="text-gray-500 mt-1">No class schedules assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <div 
                        key={schedule.scheduleId} 
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="bg-blue-600/10 p-3 rounded-lg">
                          <CalendarDays className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{schedule.topic}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(schedule.startTime), 'EEEE, MMMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}

      {user.role === Role.student && selectedBatch ? (
        <Tabs defaultValue="schedules" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="schedules" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Schedules for {selectedBatch.batchName}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="schedules" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Class Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                {batchSchedules.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium">No schedules found</h3>
                    <p className="text-gray-500 mt-1">No class schedules assigned yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {batchSchedules.map((schedule) => (
                      <div 
                        key={schedule.scheduleId} 
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="bg-blue-600/10 p-3 rounded-lg">
                          <CalendarDays className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{schedule.topic}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(schedule.startTime), 'EEEE, MMMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
};

export default UserProfile;
