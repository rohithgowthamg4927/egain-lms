import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getStudentAssignment, submitAssignment } from '@/lib/api/students';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Upload } from 'lucide-react';
import { useState } from 'react';

export default function StudentAssignmentSubmit() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [comments, setComments] = useState('');

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['studentAssignment', courseId, assignmentId],
    queryFn: () => getStudentAssignment(courseId || '', assignmentId || ''),
    enabled: !!courseId && !!assignmentId,
  });

  const submitMutation = useMutation({
    mutationFn: submitAssignment,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assignment submitted successfully',
      });
      navigate(`/student/courses/${courseId}/assignments/${assignmentId}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit assignment',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a file to submit',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('comments', comments);

    submitMutation.mutate({
      courseId: courseId || '',
      assignmentId: assignmentId || '',
      formData,
    });
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Submit Assignment</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{assignment?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">Assignment File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments (Optional)</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments about your submission..."
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              {submitMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 