import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, BookOpen, FileText, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getStudentCourses, getStudentSchedules, getStudentResources } from '@/lib/api/students';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { format } from 'date-fns';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch student data
  const { data: coursesData } = useQuery({
    queryKey: ['studentCourses', user?.userId],
    queryFn: () => getStudentCourses(user?.userId || 0),
    enabled: !!user?.userId,
  });

  const { data: schedulesData } = useQuery({
    queryKey: ['studentSchedules', user?.userId],
    queryFn: () => getStudentSchedules(user?.userId || 0),
    enabled: !!user?.userId,
  });

  const { data: resourcesData } = useQuery({
    queryKey: ['studentResources', user?.userId],
    queryFn: () => getStudentResources(user?.userId || 0),
    enabled: !!user?.userId,
  });

  useEffect(() => {
    if (coursesData && schedulesData && resourcesData) {
      setIsLoading(false);
    }
  }, [coursesData, schedulesData, resourcesData]);

  const upcomingSchedules = schedulesData?.data
    ?.filter(schedule => new Date(schedule.scheduleDate) >= new Date())
    .sort((a, b) => new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime())
    .slice(0, 3) || [];

  const recentResources = resourcesData?.data?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Dashboard', link: '/student/dashboard' }
      ]} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-12" /> : coursesData?.data?.length || 0}
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-12" /> : upcomingSchedules.length}
              </span>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-12" /> : recentResources.length}
              </span>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-12" /> : 0}
              </span>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingSchedules.length > 0 ? (
              <div className="space-y-4">
                {upcomingSchedules.map((schedule) => (
                  <div key={schedule.scheduleId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{schedule.topic}</h4>
                      <p className="text-sm text-muted-foreground">
                        {schedule.batch?.course?.courseName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(schedule.scheduleDate), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(schedule.startTime), 'hh:mm a')} - {format(new Date(schedule.endTime), 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming classes scheduled.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Resources</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentResources.length > 0 ? (
              <div className="space-y-4">
                {recentResources.map((resource) => (
                  <div key={resource.resourceId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {resource.batch?.course?.courseName}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resource.fileUrl, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No recent resources available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard; 