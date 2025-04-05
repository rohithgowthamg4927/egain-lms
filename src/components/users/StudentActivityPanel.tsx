
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getStudentCourses, getStudentSchedules } from '@/lib/api/students';
import { format } from 'date-fns';
import PasswordChangeForm from './PasswordChangeForm';
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudentActivityPanelProps {
  userId: number;
}

const StudentActivityPanel = ({ userId }: StudentActivityPanelProps) => {
  const [tab, setTab] = useState('courses');

  // Fetch student courses
  const coursesQuery = useQuery({
    queryKey: ['studentCourses', userId],
    queryFn: () => getStudentCourses(userId),
  });

  // Fetch student schedules
  const schedulesQuery = useQuery({
    queryKey: ['studentSchedules', userId],
    queryFn: () => getStudentSchedules(userId),
  });

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid grid-cols-3 mb-6">
        <TabsTrigger value="courses">Courses</TabsTrigger>
        <TabsTrigger value="schedules">Schedules</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>

      <TabsContent value="courses" className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">Enrolled Courses</h3>
        
        {coursesQuery.isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : coursesQuery.isError ? (
          <p className="text-destructive">
            Error loading course information.
          </p>
        ) : coursesQuery.data?.data && coursesQuery.data.data.length > 0 ? (
          <div className="space-y-4">
            {coursesQuery.data.data.map((course) => (
              <Card key={course.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <h4 className="font-semibold">{course.course?.title}</h4>
                  <p className="text-muted-foreground mt-1">
                    {course.course?.description?.slice(0, 100)}
                    {course.course?.description && course.course.description.length > 100 ? '...' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {course.joinedDate && format(new Date(course.joinedDate), 'MMM dd, yyyy')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No courses found.</p>
        )}
      </TabsContent>

      <TabsContent value="schedules" className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">Upcoming Classes</h3>
        
        {schedulesQuery.isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : schedulesQuery.isError ? (
          <p className="text-destructive">
            Error loading schedule information.
          </p>
        ) : schedulesQuery.data?.data && schedulesQuery.data.data.length > 0 ? (
          <div className="space-y-4">
            {schedulesQuery.data.data.map((schedule) => (
              <Card key={schedule.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <h4 className="font-semibold">{schedule.batch?.course?.title}</h4>
                  <p className="text-muted-foreground mt-1">
                    Batch: {schedule.batch?.name}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {schedule.date && format(new Date(schedule.date), 'MMM dd, yyyy')}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {schedule.startTime && format(new Date(schedule.startTime), 'hh:mm a')} - 
                      {schedule.endTime && format(new Date(schedule.endTime), 'hh:mm a')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No scheduled classes found.</p>
        )}
      </TabsContent>

      <TabsContent value="password">
        <Card>
          <CardContent className="pt-6">
            <PasswordChangeForm userId={userId} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default StudentActivityPanel;
