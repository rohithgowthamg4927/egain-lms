import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudentCourseLessons } from '@/lib/api/students';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function StudentLessons() {
  const { courseId } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  const { data: lessons, error } = useQuery({
    queryKey: ['studentCourseLessons', courseId],
    queryFn: () => getStudentCourseLessons(courseId || ''),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (lessons || error) {
      setIsLoading(false);
    }
  }, [lessons, error]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid gap-4">
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
        <p className="text-red-500">Error loading lessons. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Course Lessons</h1>
      </div>

      <div className="grid gap-4">
        {lessons?.map((lesson) => (
          <Card key={lesson.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{lesson.title}</CardTitle>
                {lesson.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">{lesson.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {lesson.duration} minutes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {format(new Date(lesson.scheduledDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link to={`/student/courses/${courseId}/lessons/${lesson.id}`}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {lesson.isCompleted ? 'Review Lesson' : 'Start Lesson'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 