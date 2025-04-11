import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStudentAssignment } from '@/lib/api/students';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Clock, FileText, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function StudentAssignmentDetail() {
  const { courseId, assignmentId } = useParams();
  const [isLoading, setIsLoading] = useState(true);

  const { data: assignment, error } = useQuery({
    queryKey: ['studentAssignment', courseId, assignmentId],
    queryFn: () => getStudentAssignment(courseId || '', assignmentId || ''),
    enabled: !!courseId && !!assignmentId,
  });

  useEffect(() => {
    if (assignment || error) {
      setIsLoading(false);
    }
  }, [assignment, error]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading assignment. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assignment Details</h1>
        <Button variant="outline" asChild>
          <Link to={`/student/courses/${courseId}/assignments`}>
            Back to Assignments
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{assignment?.title}</CardTitle>
            {assignment?.isSubmitted ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <Clock className="h-6 w-6 text-yellow-500" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium">Description</h3>
            <p className="text-gray-500">{assignment?.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Due Date</h3>
              <p className="text-gray-500">
                {format(new Date(assignment?.dueDate || ''), 'MMM d, yyyy')}
              </p>
            </div>
            {assignment?.grade && (
              <div className="space-y-2">
                <h3 className="font-medium">Grade</h3>
                <p className="text-gray-500">{assignment.grade}%</p>
              </div>
            )}
          </div>

          {assignment?.resourceUrl && (
            <div className="space-y-2">
              <h3 className="font-medium">Assignment File</h3>
              <Button variant="outline" asChild>
                <a href={assignment.resourceUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download Assignment
                </a>
              </Button>
            </div>
          )}

          {assignment?.submissionUrl && (
            <div className="space-y-2">
              <h3 className="font-medium">Your Submission</h3>
              <Button variant="outline" asChild>
                <a href={assignment.submissionUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  View Submission
                </a>
              </Button>
            </div>
          )}

          {!assignment?.isSubmitted && (
            <Button className="w-full" asChild>
              <Link to={`/student/courses/${courseId}/assignments/${assignmentId}/submit`}>
                <Upload className="h-4 w-4 mr-2" />
                Submit Assignment
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 