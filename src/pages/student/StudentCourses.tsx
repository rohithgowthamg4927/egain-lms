
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getStudentCourses } from '@/lib/api/students';
import { submitCourseReview } from '@/lib/api/students';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Calendar, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudentCourse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

export default function StudentCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<StudentCourse | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: coursesResponse, error, refetch } = useQuery({
    queryKey: ['studentCourses', user?.userId],
    queryFn: () => {
      if (!user?.userId) throw new Error('User ID required');
      return getStudentCourses(user.userId);
    },
    enabled: !!user?.userId
  });

  const courses = coursesResponse?.data || [];

  useEffect(() => {
    if (coursesResponse || error) {
      setIsLoading(false);
    }
  }, [coursesResponse, error]);

  const handleOpenReviewDialog = (course: StudentCourse) => {
    setSelectedCourse(course);
    setRating(0);
    setReview('');
    setOpenReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedCourse || !user?.userId || rating === 0) {
      toast({
        title: "Error",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitCourseReview(
        user.userId,
        selectedCourse.courseId,
        rating,
        review
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "Your review has been submitted",
        });
        setOpenReviewDialog(false);
        refetch(); // Refresh the courses data
      } else {
        throw new Error(result.error || "Failed to submit review");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BreadcrumbNav items={[
          { label: 'Courses', link: '/student/courses' }
        ]} />
        <h1 className="text-2xl font-bold">My Courses</h1>
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
        <BreadcrumbNav items={[
          { label: 'Courses', link: '/student/courses' }
        ]} />
        <p className="text-red-500">Error loading courses. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Courses', link: '/student/courses' }
      ]} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Courses</h1>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">You are not enrolled in any courses yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.studentCourseId} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{course.course.courseName}</span>
                </CardTitle>
                <CardDescription>
                  {course.course.category?.categoryName || 'No category'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {course.course.description || 'No description available'}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>Enrolled on {new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleOpenReviewDialog(course)}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Review Course
                </Button>
                <Button asChild size="sm">
                  <Link to={`/student/courses/${course.courseId}`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={openReviewDialog} onOpenChange={setOpenReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Course</DialogTitle>
            <DialogDescription>
              {selectedCourse?.course.courseName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none focus:ring-0"
                  >
                    <Star 
                      className={`h-8 w-8 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Review (Optional)</label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your thoughts about this course..."
                className="w-full h-24 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReviewDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitReview} 
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
