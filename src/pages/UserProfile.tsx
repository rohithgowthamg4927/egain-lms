
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getUser, updateUser, deleteUser, regenerateUserPassword } from '@/lib/api';
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
import { CalendarDays, Clock, Edit, User as UserIcon, ChevronLeft, Trash, RefreshCw, Copy, Check, KeyRound } from 'lucide-react';
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegeneratingPassword, setIsRegeneratingPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);

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
        const response = await getUser(parseInt(userId));
        
        if (response.success && response.data) {
          const userData = response.data;
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

  const handleDelete = async () => {
    if (!user) return;
    
    try {
      const response = await deleteUser(user.userId);
      
      if (response.success) {
        toast({
          title: 'User deleted',
          description: 'The user has been deleted successfully.',
        });
        handleGoBack();
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
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleCopyPassword = () => {
    if (user?.password) {
      navigator.clipboard.writeText(user.password);
      setPasswordCopied(true);
      toast({
        title: 'Password copied',
        description: 'Password copied to clipboard',
      });
      
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  const handleRegeneratePassword = async () => {
    if (!user) return;
    
    setIsRegeneratingPassword(true);
    try {
      const response = await regenerateUserPassword(user.userId);
      
      if (response.success && response.data) {
        // Update user object with new password
        setUser({
          ...user,
          password: response.data.password
        });
        
        toast({
          title: 'Password regenerated',
          description: 'The password has been regenerated successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to regenerate password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error regenerating password:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate password',
        variant: 'destructive',
      });
    } finally {
      setIsRegeneratingPassword(false);
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
          <div className="flex gap-2">
            <Button onClick={handleEditProfile} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user
                    and remove any associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
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
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.profilePicture?.fileUrl} alt={user.fullName} />
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{user.fullName}</h3>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p>{user.phoneNumber || 'Not provided'}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Bio</p>
                  <p>{user.bio || 'No bio available'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="schedules">
              <TabsList>
                <TabsTrigger value="schedules">Schedules</TabsTrigger>
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>
              <TabsContent value="schedules">
                {user.role === Role.instructor ? (
                  <div className="space-y-4">
                    {schedules.length > 0 ? (
                      schedules.map((schedule) => (
                        <div key={schedule.scheduleId} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{schedule.topic}</h4>
                            <p className="text-sm text-gray-500">
                              {format(new Date(schedule.startTime), 'MMM d, yyyy h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No schedules found</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {batchSchedules.length > 0 ? (
                      batchSchedules.map((schedule) => (
                        <div key={schedule.scheduleId} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <CalendarDays className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{schedule.topic}</h4>
                            <p className="text-sm text-gray-500">
                              {format(new Date(schedule.startTime), 'MMM d, yyyy h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No schedules found</p>
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="courses">
                <p className="text-gray-500">Course information will be available in a future update.</p>
              </TabsContent>
              <TabsContent value="password">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <KeyRound className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">User Password</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      The current password for this user is shown below. You can copy it or regenerate a new password.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Input 
                          value={user.password || "No password set"} 
                          readOnly 
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={handleCopyPassword}
                        >
                          {passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        onClick={handleRegeneratePassword}
                        disabled={isRegeneratingPassword}
                        variant="outline"
                      >
                        {isRegeneratingPassword ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Note: When regenerating a password, the user will need to reset it on their next login.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
