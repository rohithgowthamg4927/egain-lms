
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUser } from '@/lib/api/users';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsContent as TabsContentComp, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from '@/lib/types';
import { ArrowLeft, User as UserIcon, Mail, Phone, Calendar } from 'lucide-react';
import StudentActivityPanel from '@/components/users/StudentActivityPanel';
import InstructorActivityPanel from '@/components/users/InstructorActivityPanel';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: `${userTypeLabel}s`, link: basePath },
        { label: user?.fullName || 'User Profile', link: `${basePath}/${userId}` }
      ]} />
      
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
                    <h2 className="text-xl font-bold">{user.fullName}</h2>
                    <Badge className="mt-2">{user.role}</Badge>
                    
                    <div className="w-full space-y-3 mt-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{user.phoneNumber || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-muted-foreground">Joined</p>
                          <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {isStudent && (
                <StudentActivityPanel userId={Number(userId)} />
              )}
              
              {isInstructor && (
                <InstructorActivityPanel userId={Number(userId)} />
              )}
              
              {!isStudent && !isInstructor && (
                <Card className="md:col-span-3">
                  <CardContent className="pt-6">
                    <p>Activity information is only available for students and instructors.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
