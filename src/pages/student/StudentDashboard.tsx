// Import necessary components and hooks
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, FileText, BookOpen, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { getStudentCourses, getStudentSchedules, getStudentResources } from '@/lib/api/students';
import { useNavigate } from 'react-router-dom';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.userId) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.userId) return;
    
    setIsLoading(true);
    try {
      // Fetch courses
      const coursesResponse = await getStudentCourses(user.userId);
      if (coursesResponse.success && coursesResponse.data) {
        setCourses(coursesResponse.data);
      }

      // Fetch schedules
      const schedulesResponse = await getStudentSchedules(user.userId);
      if (schedulesResponse.success && schedulesResponse.data) {
        setSchedules(schedulesResponse.data);
      }

      // Fetch resources
      const resourcesResponse = await getStudentResources(user.userId);
      if (resourcesResponse.success && resourcesResponse.data) {
        setResources(resourcesResponse.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format schedule time
  const formatTime = (timeString) => {
    try {
      const date = new Date(`1970-01-01T${timeString}`);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return timeString;
    }
  };

  // Format schedule date
  const formatScheduleDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  // Calculate upcoming schedules (next 7 days)
  const upcomingSchedules = schedules
    .filter(schedule => {
      try {
        const scheduleDate = new Date(schedule.scheduleDate);
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        return scheduleDate >= today && scheduleDate <= sevenDaysFromNow;
      } catch (error) {
        return false; // Skip items with invalid dates
      }
    })
    .sort((a, b) => new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime())
    .slice(0, 5);

  // Get recent resources (last 5)
  const recentResources = [...resources]
    .sort((a, b) => {
      try {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } catch (error) {
        return 0; // Keep original order if dates are invalid
      }
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Dashboard', link: '/student/dashboard' }
      ]} />
      
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back, {user?.fullName}. Here's an overview of your learning journey.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingSchedules.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Resources</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentResources.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="schedule" className="space-y-4">
            <TabsList>
              <TabsTrigger value="schedule">Upcoming Schedule</TabsTrigger>
              <TabsTrigger value="resources">Recent Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule" className="space-y-4">
              <div className="grid gap-4 grid-cols-1">
                {upcomingSchedules.length > 0 ? (
                  upcomingSchedules.map((schedule) => (
                    <Card key={schedule.scheduleId}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{schedule.topic || 'Class Session'}</h3>
                              <p className="text-sm text-muted-foreground">
                                {schedule.batch?.course?.courseName} - {schedule.batch?.batchName}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col md:items-end gap-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatScheduleDate(schedule.scheduleDate)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No upcoming classes scheduled.</p>
                    </CardContent>
                  </Card>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/student/schedules')}
                >
                  View All Schedules
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="resources" className="space-y-4">
              <div className="grid gap-4 grid-cols-1">
                {recentResources.length > 0 ? (
                  recentResources.map((resource) => (
                    <Card key={resource.resourceId}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{resource.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {resource.batch ? `${resource.batch.course.courseName} - ${resource.batch.batchName}` : 
                                 (resource.batchId ? `Batch ID: ${resource.batchId}` : 'General Resource')}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col md:items-end gap-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{format(new Date(resource.createdAt), 'PPP')}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No resources available yet.</p>
                    </CardContent>
                  </Card>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/student/resources')}
                >
                  View All Resources
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
