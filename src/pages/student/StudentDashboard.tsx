
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getStudentCourses, getStudentSchedules, getStudentResources } from '@/lib/api/students';
import { Schedule, Resource } from '@/lib/types';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Calendar, Clock, FileText, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [pendingReviews, setPendingReviews] = useState(0);

  // Query for student courses
  const coursesQuery = useQuery({
    queryKey: ['studentCourses', user?.userId],
    queryFn: () => {
      if (!user?.userId) throw new Error('User ID required');
      return getStudentCourses(user.userId);
    },
    enabled: !!user?.userId
  });

  // Query for student schedules
  const schedulesQuery = useQuery({
    queryKey: ['studentSchedules', user?.userId],
    queryFn: () => {
      if (!user?.userId) throw new Error('User ID required');
      return getStudentSchedules(user.userId);
    },
    enabled: !!user?.userId
  });

  // Use the resource data directly from the API
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      if (!user?.userId) return;
      
      try {
        setIsLoadingResources(true);
        const response = await getStudentResources(user.userId);
        if (response && Array.isArray(response)) {
          setResources(response);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
      } finally {
        setIsLoadingResources(false);
      }
    };

    fetchResources();
  }, [user?.userId]);

  // Calculate metrics from query results
  const coursesCount = coursesQuery.data?.data?.length || 0;
  const schedules = schedulesQuery.data?.data || [];
  const upcomingClassesCount = schedules.length;
  const resourcesCount = resources.length;

  // Order schedules by date
  const sortedSchedules = [...schedules].sort((a, b) => 
    new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime()
  );

  // Show only the next few schedules
  const nextSchedules = sortedSchedules.slice(0, 3);

  const isLoading = coursesQuery.isLoading || schedulesQuery.isLoading || isLoadingResources;

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Dashboard', link: '/student/dashboard' }
      ]} />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{coursesCount}</span>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
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
                <span className="text-3xl font-bold">{upcomingClassesCount}</span>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{resourcesCount}</span>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-600" />
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
                <span className="text-3xl font-bold">{pendingReviews}</span>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Schedule */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>Your next classes</CardDescription>
          </CardHeader>
          <CardContent>
            {schedulesQuery.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : nextSchedules.length > 0 ? (
              <div className="space-y-4">
                {nextSchedules.map((schedule) => (
                  <div key={schedule.scheduleId} className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex flex-shrink-0 items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{schedule.topic || schedule.batch.course.courseName}</p>
                      <div className="text-sm text-muted-foreground">
                        <p>{format(parseISO(schedule.scheduleDate), 'PPP')}</p>
                        <p>{schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}</p>
                      </div>
                      {schedule.meetingLink && (
                        <div className="mt-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={schedule.meetingLink} target="_blank" rel="noopener noreferrer">
                              Join Meeting
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="pt-2">
                  <Button variant="ghost" size="sm" asChild className="gap-1">
                    <Link to="/student/schedules">
                      View all schedules
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No upcoming classes scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Resources */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Resources</CardTitle>
            <CardDescription>Latest learning materials</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingResources ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : resources.length > 0 ? (
              <div className="space-y-4">
                {resources.slice(0, 3).map((resource) => (
                  <div key={resource.resourceId} className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex flex-shrink-0 items-center justify-center">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{resource.title || resource.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {resource.batch?.batchName || 'Course material'}
                      </p>
                      <div className="mt-2">
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2">
                  <Button variant="ghost" size="sm" asChild className="gap-1">
                    <Link to="/student/resources">
                      View all resources
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No learning resources available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
