
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '@/lib/api/dashboard';
import { getStudentCourses, getStudentSchedules } from '@/lib/api/students';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Book, Clock } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import StudentActivityPanel from '@/components/students/StudentActivityPanel';

const StudentDashboard = () => {
  const { user } = useAuth();
  const userId = user?.userId;

  // Query for student-specific metrics instead of admin metrics
  const metricsQuery = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: getDashboardMetrics
  });

  // Fetch courses for the current student
  const coursesQuery = useQuery({
    queryKey: ['studentCourses', userId],
    queryFn: () => (userId ? getStudentCourses(userId) : Promise.resolve({ success: false, data: [] })),
    enabled: !!userId,
  });

  // Fetch upcoming schedules for the student
  const schedulesQuery = useQuery({
    queryKey: ['studentSchedules', userId],
    queryFn: () => (userId ? getStudentSchedules(userId) : Promise.resolve({ success: false, data: [] })),
    enabled: !!userId,
  });

  const isLoading = metricsQuery.isLoading || coursesQuery.isLoading || schedulesQuery.isLoading;

  // Helper function to safely format dates
  const safeFormatDate = (dateString: string | undefined, formatStr: string = 'MMM dd, yyyy') => {
    if (!dateString) return 'No date';
    
    try {
      // Ensure we have a valid date
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return isValid(date) ? format(date, formatStr) : 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string was:', dateString);
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="text-2xl font-bold">
                {coursesQuery.data?.data?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="text-2xl font-bold">
                {schedulesQuery.data?.data?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Class</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : schedulesQuery.data?.data && schedulesQuery.data.data.length > 0 ? (
              <div>
                <div className="text-sm text-muted-foreground">
                  {schedulesQuery.data.data[0].scheduleDate && 
                    safeFormatDate(schedulesQuery.data.data[0].scheduleDate)}
                </div>
                <div className="font-medium">
                  {schedulesQuery.data.data[0].batch?.course?.courseName?.slice(0, 18)}
                  {schedulesQuery.data.data[0].batch?.course?.courseName?.length > 18 ? '...' : ''}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No upcoming classes</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="schedule">Upcoming Schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="space-y-4">
          {userId && <StudentActivityPanel userId={userId} />}
        </TabsContent>
        <TabsContent value="schedule" className="space-y-4">
          {userId && <StudentActivityPanel userId={userId} showSchedulesOnly />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
