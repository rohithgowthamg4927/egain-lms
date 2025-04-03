
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Course } from '@/lib/types';
import { Pencil, Mail, Phone, Calendar, Book } from 'lucide-react';
import { formatDate } from '@/lib/utils/date-helpers';

const Profile = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserCourses = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        // For now, we'll just set an empty array
        // Later we can implement the actual API call
        setCourses([]);
      } catch (error) {
        console.error('Error loading user courses:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserCourses();
  }, [user]);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Please login to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button variant="outline">
          <Pencil className="h-4 w-4 mr-2" /> Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.photoUrl || ""} alt={user.fullName} />
                <AvatarFallback>{user.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{user.fullName}</CardTitle>
              <CardDescription>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                  <span>{user.phoneNumber}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {user.bio || "No bio information added yet."}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Enrolled Courses</CardTitle>
                  <CardDescription>
                    Courses you are currently enrolled in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Loading your courses...</p>
                  ) : courses.length === 0 ? (
                    <p className="text-muted-foreground">You are not enrolled in any courses yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {courses.map(course => (
                        <div key={course.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                          <div className="bg-primary/10 p-2 rounded">
                            <Book className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{course.courseName}</h3>
                            <p className="text-sm text-muted-foreground">{course.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="achievements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Achievements</CardTitle>
                  <CardDescription>
                    Certificates and accomplishments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No achievements yet.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
