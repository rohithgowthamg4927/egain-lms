
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getInstructorCourses, getInstructorSchedules } from '@/lib/api/instructors';
import { format } from 'date-fns';
import { Calendar, BookOpen, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PasswordChangeForm from './PasswordChangeForm';

interface InstructorActivityPanelProps {
  userId: number;
}

const InstructorActivityPanel = ({ userId }: InstructorActivityPanelProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('courses');

  // Fetch instructor courses
  const coursesQuery = useQuery({
    queryKey: ['instructor-courses', userId],
    queryFn: () => getInstructorCourses(userId),
    enabled: activeTab === 'courses',
  });

  // Fetch instructor schedules
  const schedulesQuery = useQuery({
    queryKey: ['instructor-schedules', userId],
    queryFn: () => getInstructorSchedules(userId),
    enabled: activeTab === 'schedules',
  });

  // Show errors as toasts
  useEffect(() => {
    if (coursesQuery.isError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch instructor courses',
        variant: 'destructive',
      });
    }

    if (schedulesQuery.isError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch instructor schedules',
        variant: 'destructive',
      });
    }
  }, [coursesQuery.isError, schedulesQuery.isError, toast]);

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            {coursesQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : coursesQuery.isError ? (
              <Alert>
                <AlertDescription>Failed to fetch course information. Please try again later.</AlertDescription>
              </Alert>
            ) : coursesQuery.data?.data && coursesQuery.data.data.length > 0 ? (
              <div className="space-y-3">
                {coursesQuery.data.data.map((course) => (
                  <Card key={course.courseId} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="rounded-md bg-blue-100 p-2 flex-shrink-0">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{course.courseName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {course.category?.categoryName || 'Uncategorized'} · {course.courseLevel.charAt(0).toUpperCase() + course.courseLevel.slice(1)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{course._count?.studentCourses || 0} students</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-3" />
                <h3 className="font-medium text-lg">No Courses Found</h3>
                <p className="text-muted-foreground">This instructor is not teaching any courses yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedules">
            {schedulesQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : schedulesQuery.isError ? (
              <Alert>
                <AlertDescription>Failed to fetch schedule information. Please try again later.</AlertDescription>
              </Alert>
            ) : schedulesQuery.data?.data && schedulesQuery.data.data.length > 0 ? (
              <div className="space-y-3">
                {schedulesQuery.data.data.map((schedule) => (
                  <Card key={schedule.scheduleId} className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="rounded-md bg-blue-100 p-2 flex-shrink-0">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{schedule.topic}</h4>
                            <p className="text-sm text-muted-foreground">
                              {schedule.batch?.batchName || 'N/A'} · {schedule.batch?.course?.courseName || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end text-sm">
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(schedule.scheduleDate), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">
                              {format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-30 mb-3" />
                <h3 className="font-medium text-lg">No Schedules Found</h3>
                <p className="text-muted-foreground">This instructor does not have any upcoming schedules.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="password">
            <PasswordChangeForm userId={userId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default InstructorActivityPanel;
