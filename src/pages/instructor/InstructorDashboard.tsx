
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getInstructorCourses, getInstructorSchedules } from '@/lib/api/instructors';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const instructorId = user?.userId;

  const coursesQuery = useQuery({
    queryKey: ['instructorCourses', instructorId],
    queryFn: () => instructorId ? getInstructorCourses(instructorId) : Promise.resolve({ success: false, data: [] }),
    enabled: !!instructorId,
  });

  const schedulesQuery = useQuery({
    queryKey: ['instructorSchedules', instructorId],
    queryFn: () => instructorId ? getInstructorSchedules(instructorId) : Promise.resolve({ success: false, data: [] }),
    enabled: !!instructorId,
  });

  const courses = coursesQuery.data?.data || [];
  const schedules = schedulesQuery.data?.data || [];

  // Get unique batch count from schedules
  const uniqueBatchIds = [...new Set(schedules.map(schedule => schedule.batchId))];
  const batchCount = uniqueBatchIds.length;

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Dashboard', link: '/dashboard' }
      ]} />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate('/courses')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Courses
            </CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {coursesQuery.isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{courses.length}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Courses you are teaching
            </p>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate('/batches')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Batches
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {schedulesQuery.isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{batchCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Batches assigned to you
            </p>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => navigate('/schedules')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Sessions
            </CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {schedulesQuery.isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{schedules.length}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Upcoming class sessions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="schedules">Upcoming Schedules</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Courses You Teach</CardTitle>
              <CardDescription>
                View all courses you are currently teaching
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coursesQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-4">
                  {courses.slice(0, 5).map((course) => (
                    <div
                      key={course.courseId}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/courses/${course.courseId}`)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{course.courseName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {course.category?.categoryName || 'Uncategorized'} • {course._count?.batches || 0} Batches
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {course._count?.studentCourses || 0} Students
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No courses assigned yet
                </div>
              )}
              {courses.length > 5 && (
                <div className="mt-4 text-center">
                  <button 
                    className="text-primary text-sm hover:underline" 
                    onClick={() => navigate('/courses')}
                  >
                    View all {courses.length} courses
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>
                Your scheduled classes for the coming days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {schedulesQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : schedules.length > 0 ? (
                <div className="space-y-4">
                  {schedules.slice(0, 5).map((schedule) => (
                    <div 
                      key={schedule.scheduleId} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/schedules')}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{schedule.topic || 'Untitled Session'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {schedule.batch?.course?.courseName || 'Unknown Course'} • {schedule.batch?.batchName || 'Unknown Batch'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm whitespace-nowrap">
                        <div className="font-medium">
                          {new Date(schedule.scheduleDate).toLocaleDateString()}
                        </div>
                        <div className="text-muted-foreground">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming sessions scheduled
                </div>
              )}
              {schedules.length > 5 && (
                <div className="mt-4 text-center">
                  <button 
                    className="text-primary text-sm hover:underline" 
                    onClick={() => navigate('/schedules')}
                  >
                    View all {schedules.length} scheduled sessions
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstructorDashboard;
