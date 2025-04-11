import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudentCourseDetail } from '@/lib/api/students';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Calendar, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  const { data: course, error } = useQuery({
    queryKey: ['studentCourseDetail', courseId],
    queryFn: () => getStudentCourseDetail(courseId || ''),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (course || error) {
      setIsLoading(false);
    }
  }, [course, error]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading course details. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{course?.courseName}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">{course?.description}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                Category: {course?.category?.categoryName || 'Uncategorized'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Assignments</span>
              <span className="text-sm font-medium">
                {course?.assignments?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Resources</span>
              <span className="text-sm font-medium">
                {course?.resources?.length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Schedules</span>
              <span className="text-sm font-medium">
                {course?.schedules?.length || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" asChild>
          <Link to={`/student/courses/${courseId}/assignments`}>
            View Assignments
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/student/courses/${courseId}/resources`}>
            View Resources
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/student/courses/${courseId}/schedules`}>
            View Schedules
          </Link>
        </Button>
      </div>
    </div>
  );
} 