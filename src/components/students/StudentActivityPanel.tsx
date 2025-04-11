
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { getStudentCourses, getStudentSchedules } from '@/lib/api/students';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, BookOpen, ExternalLink } from 'lucide-react';

interface StudentActivityPanelProps {
  userId: number;
  showSchedulesOnly?: boolean;
}

const StudentActivityPanel = ({ userId, showSchedulesOnly = false }: StudentActivityPanelProps) => {
  // Get student's courses
  const coursesQuery = useQuery({
    queryKey: ['studentCourses', userId],
    queryFn: () => getStudentCourses(userId),
    enabled: !!userId && !showSchedulesOnly,
  });

  // Get student's schedules
  const schedulesQuery = useQuery({
    queryKey: ['studentSchedules', userId],
    queryFn: () => getStudentSchedules(userId),
    enabled: !!userId,
  });

  const isLoadingCourses = coursesQuery.isLoading;
  const isLoadingSchedules = schedulesQuery.isLoading;
  
  return (
    <div className="space-y-4">
      {!showSchedulesOnly && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Courses</h3>
            {isLoadingCourses ? (
              <p className="text-muted-foreground">Loading your courses...</p>
            ) : coursesQuery.data?.data?.length === 0 ? (
              <p className="text-muted-foreground">You are not enrolled in any courses yet.</p>
            ) : (
              <div className="space-y-4">
                {coursesQuery.data?.data?.map((enrollment) => (
                  <div key={enrollment.studentCourseId} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {enrollment.course?.courseName || 'Unnamed Course'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {enrollment.course?.category?.categoryName || 'Uncategorized'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/courses/${enrollment.courseId}`} className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" />
                          View Course
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Classes</h3>
          {isLoadingSchedules ? (
            <p className="text-muted-foreground">Loading your schedule...</p>
          ) : schedulesQuery.data?.data?.length === 0 ? (
            <p className="text-muted-foreground">No upcoming classes scheduled.</p>
          ) : (
            <div className="space-y-4">
              {schedulesQuery.data?.data?.slice(0, 5).map((schedule) => (
                <div key={schedule.scheduleId} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {schedule.batch?.course?.courseName || 'Unnamed Course'}
                      </h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1 gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(schedule.scheduleDate), 'PPP')}
                        <span>•</span>
                        {format(new Date(`${schedule.scheduleDate}T${schedule.startTime}`), 'p')} -
                        {format(new Date(`${schedule.scheduleDate}T${schedule.endTime}`), 'p')}
                      </div>
                      {schedule.topic && (
                        <p className="text-sm mt-1">{schedule.topic}</p>
                      )}
                    </div>
                    {schedule.meetingLink && (
                      <Button variant="outline" size="sm" asChild>
                        <a 
                          href={schedule.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Join
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentActivityPanel;
