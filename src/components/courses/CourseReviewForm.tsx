
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getCourseById } from '@/lib/api/courses';
import { addCourseReview, getStudentCourses } from '@/lib/api/student-courses';
import { Star } from 'lucide-react';

const CourseReviewForm = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const parsedCourseId = courseId ? parseInt(courseId, 10) : 0;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  
  // Check if student is enrolled in this course
  const enrollmentQuery = useQuery({
    queryKey: ['studentCourses', user?.userId],
    queryFn: () => user?.userId ? getStudentCourses(user.userId) : Promise.resolve({ success: false, data: [] }),
    enabled: !!user?.userId,
  });
  
  // Fetch course details
  const courseQuery = useQuery({
    queryKey: ['course', parsedCourseId],
    queryFn: () => getCourseById(parsedCourseId),
    enabled: !!parsedCourseId,
  });

  // Check if student is enrolled in this course
  const isEnrolled = enrollmentQuery.data?.data?.some(
    enrollment => enrollment.courseId === parsedCourseId
  );
  
  // Check if student has already reviewed this course
  const hasReviewed = courseQuery.data?.data?.reviews?.some(
    review => review.userId === user?.userId
  );

  // Add review mutation
  const reviewMutation = useMutation({
    mutationFn: () => {
      if (!user?.userId || !parsedCourseId) {
        throw new Error('Missing required data');
      }
      return addCourseReview(parsedCourseId, user.userId, rating, comment);
    },
    onSuccess: () => {
      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });
      setRating(0);
      setComment('');
      // Invalidate course query to refresh reviews
      queryClient.invalidateQueries({ queryKey: ['course', parsedCourseId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit review',
        variant: 'destructive',
      });
    },
  });

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: 'Error',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }
    
    reviewMutation.mutate();
  };

  if (!isEnrolled) {
    return null; // Don't show the review form if not enrolled
  }
  
  if (hasReviewed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Course Review</CardTitle>
          <CardDescription>You have already reviewed this course</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate this Course</CardTitle>
        <CardDescription>Share your experience with this course</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none"
            >
              <Star 
                className={`h-8 w-8 ${
                  star <= (hoverRating || rating) 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-gray-300'
                }`} 
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
          </span>
        </div>
        
        <div>
          <Textarea
            placeholder="Write your review here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmitReview} 
          disabled={reviewMutation.isPending || rating === 0}
        >
          {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseReviewForm;
