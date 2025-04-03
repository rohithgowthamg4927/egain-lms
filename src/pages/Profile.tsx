import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser } from '@/lib/api';
import { User } from '@/lib/types';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ProfileProps {
  noHeader?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ noHeader = false }) => {
  const { userId } = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await getUser(Number(userId));

        if (response.success && response.data) {
          setUser(response.data);
        } else {
          setError(response.error || 'Failed to fetch user data');
          toast({
            title: 'Error',
            description: response.error || 'Failed to fetch user data',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('An error occurred while fetching user data');
        toast({
          title: 'Error',
          description: 'An error occurred while fetching user data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <RefreshCw className="animate-spin h-12 w-12 text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-lg text-muted-foreground">{error || 'User not found'}</p>
      </div>
    );
  }

  return (
    <div>
      {!noHeader && (
        <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>User details and information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="h-32 w-32 mb-4">
              <AvatarImage src={user.profilePicture?.fileUrl || ''} alt={user.fullName} />
              <AvatarFallback className="text-2xl">{`${user.fullName?.charAt(0) || ''}`}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{user.fullName || ''}</h2>
            <p className="text-muted-foreground mb-2">{user.email}</p>
            <Badge variant="outline" className="mb-4">
              {user.role === 'student' ? 'Student' : user.role === 'instructor' ? 'Instructor' : 'Administrator'}
            </Badge>
            <div className="w-full space-y-2 mt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span>{user.phoneNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined:</span>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Additional information about the user</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Bio</h3>
                <p className="text-base">{user.bio || 'No bio available'}</p>
              </div>
              {user.role === 'student' && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Education</h3>
                  <p className="text-base">{'No education information available'}</p>
                </div>
              )}
              {user.role === 'instructor' && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Expertise</h3>
                  <p className="text-base">{'No expertise information available'}</p>
                </div>
              )}
              {user.address && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                  <p className="text-base">{user.address || 'No address available'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
