import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getStudentCourses } from '@/lib/api/students';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentCourses() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const { data: courses, error } = useQuery({
    queryKey: ['studentCourses', user?.id],
    queryFn: () => getStudentCourses(user?.id || ''),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (courses || error) {
      setIsLoading(false);
    }
  }, [courses, error]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading courses. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Courses</h1>
      </div>

      {courses?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">You are not enrolled in any courses yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{course.title}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{course.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {course.batchCount} {course.batchCount === 1 ? 'Batch' : 'Batches'}
                  </span>
                  <Button asChild>
                    <Link to={`/student/courses/${course.id}`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 