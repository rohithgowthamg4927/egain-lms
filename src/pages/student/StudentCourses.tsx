import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getStudentCourses, submitCourseReview, updateCourseReview, deleteCourseReview } from '@/lib/api/students';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Book, Calendar, Clock, Star, Edit, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { Level } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function StudentCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.userId) {
      fetchCourses();
    }
  }, [user?.userId]);

  const fetchCourses = async () => {
    if (!user?.userId) return;
    
    setIsLoading(true);
    try {
      const response = await getStudentCourses(user.userId);
      
      if (response.success && response.data) {
        setCourses(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your enrolled courses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewDialog = (course) => {
    setSelectedCourse(course);
    setRating(5);
    setReview('');
    setIsReviewDialogOpen(true);
  };

  const openEditDialog = (course, review) => {
    setSelectedCourse(course);
    setSelectedReview(review);
    setRating(review.rating);
    setReview(review.review || '');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (course, review) => {
    setSelectedCourse(course);
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedCourse || !user?.userId) return;
    
    setIsSubmitting(true);
    try {
      const response = await submitCourseReview(
        user.userId,
        selectedCourse.course.courseId,
        rating,
        review
      );
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Your review has been submitted successfully',
        });
        setIsReviewDialogOpen(false);
        fetchCourses();
      } else {
        throw new Error(response.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit your review',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReview = async () => {
    if (!selectedCourse || !selectedReview || !user?.userId) return;
    
    setIsSubmitting(true);
    try {
      const response = await updateCourseReview(
        user.userId,
        selectedCourse.course.courseId,
        selectedReview.reviewId,
        rating,
        review
      );
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Your review has been updated successfully',
        });
        setIsEditDialogOpen(false);
        fetchCourses();
      } else {
        throw new Error(response.error || 'Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: 'Error',
        description: 'Failed to update your review',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedCourse || !selectedReview || !user?.userId) return;
    
    setIsSubmitting(true);
    try {
      const response = await deleteCourseReview(
        user.userId,
        selectedCourse.course.courseId,
        selectedReview.reviewId
      );
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Your review has been deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        fetchCourses();
      } else {
        throw new Error(response.error || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete your review',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLevelLabel = (level) => {
    const levelMap = {
      [Level.beginner]: 'Beginner',
      [Level.intermediate]: 'Intermediate',
      [Level.advanced]: 'Advanced'
    };
    return levelMap[level] || level;
  };

  const getLevelColor = (level) => {
    const colorMap = {
      [Level.beginner]: 'bg-green-100 text-green-800',
      [Level.intermediate]: 'bg-blue-100 text-blue-800',
      [Level.advanced]: 'bg-purple-100 text-purple-800'
    };
    return colorMap[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'My Courses', link: '/student/courses' }
      ]} />
      
      <h1 className="text-3xl font-bold">My Courses</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading your courses...</p>
          </div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <Book className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No courses enrolled</h3>
          <p className="mt-2 text-muted-foreground">
            You haven't enrolled in any courses yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {courses.map((studentCourse) => (
            <Card key={studentCourse.studentCourseId} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">
                    {studentCourse.course.courseName}
                  </CardTitle>
                  <Badge className={getLevelColor(studentCourse.course.courseLevel)}>
                    {getLevelLabel(studentCourse.course.courseLevel)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-muted-foreground text-sm mb-4">
                  {studentCourse.course.description || 'No description available.'}
                </p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center text-sm">
                    <Book className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Category: {studentCourse.course.category?.categoryName || 'Uncategorized'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>Enrolled: {format(new Date(studentCourse.createdAt), 'PP')}</span>
                  </div>
                </div>

                {studentCourse.course.reviews?.find(r => r.userId === user?.userId) ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Your Review</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(studentCourse, studentCourse.course.reviews.find(r => r.userId === user?.userId))}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(studentCourse, studentCourse.course.reviews.find(r => r.userId === user?.userId))}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < studentCourse.course.reviews.find(r => r.userId === user?.userId).rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {studentCourse.course.reviews.find(r => r.userId === user?.userId).review && (
                      <p className="text-sm text-muted-foreground">
                        {studentCourse.course.reviews.find(r => r.userId === user?.userId).review}
                      </p>
                    )}
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => openReviewDialog(studentCourse)}
                  >
                    Rate & Review Course
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate & Review Course</DialogTitle>
            <DialogDescription>
              {selectedCourse?.course.courseName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Rating</h4>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="review" className="text-sm font-medium">
                Review (Optional)
              </label>
              <Textarea
                id="review"
                placeholder="Write your review here..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Review Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Your Review</DialogTitle>
            <DialogDescription>
              {selectedCourse?.course.courseName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Rating</h4>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${
                      star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="review" className="text-sm font-medium">
                Review (Optional)
              </label>
              <Textarea
                id="review"
                placeholder="Write your review here..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Review Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete your review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your review will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteReview}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Review'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
