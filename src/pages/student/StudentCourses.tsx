import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getCourses } from '@/lib/api/courses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { getStudentCourses, submitCourseReview, updateCourseReview, deleteCourseReview } from '@/lib/api/students';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Book, Calendar, Clock, Star, Edit, Trash, Search, Filter, BookOpen, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Level } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function StudentCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('enrolled');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allCoursesData, isLoading: isAllCoursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const { data: studentCoursesData, isLoading: isStudentCoursesLoading, refetch: refetchStudentCourses } = useQuery({
    queryKey: ['studentCourses', user?.userId],
    queryFn: () => getStudentCourses(user?.userId || 0),
    enabled: !!user?.userId,
  });

  useEffect(() => {
    if (studentCoursesData?.success && studentCoursesData.data) {
      setEnrolledCourses(studentCoursesData.data);
    }
    if (!isAllCoursesLoading && !isStudentCoursesLoading) {
      setIsLoading(false);
    }
  }, [studentCoursesData, isAllCoursesLoading, isStudentCoursesLoading]);

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
        refetchStudentCourses();
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
        refetchStudentCourses();
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
        refetchStudentCourses();
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

  const viewCourseDetails = (courseId) => {
    navigate(`/student/courses/${courseId}`);
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

  const filteredAllCourses = allCoursesData?.data?.filter(course => {
    const matchesSearch = 
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      (course.categoryId && course.categoryId.toString() === selectedCategory);
    
    const matchesLevel = 
      selectedLevel === 'all' || 
      course.courseLevel === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  }) || [];

  const filteredEnrolledCourses = enrolledCourses.filter(studentCourse => {
    const course = studentCourse.course;
    
    const matchesSearch = 
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      (course.categoryId && course.categoryId.toString() === selectedCategory);
    
    const matchesLevel = 
      selectedLevel === 'all' || 
      course.courseLevel === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const allCategories = allCoursesData?.data ? [...new Set(allCoursesData.data
    .filter(course => course.category)
    .map(course => ({ 
      id: course.category.categoryId, 
      name: course.category.categoryName 
    }))
    .map(category => JSON.stringify(category))
  )]
  .map(category => JSON.parse(category))
  .sort((a, b) => a.name.localeCompare(b.name)) : [];

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'My Courses', link: '/student/courses' }
      ]} />
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Courses</h1>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search courses..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value={Level.beginner}>Beginner</SelectItem>
              <SelectItem value={Level.intermediate}>Intermediate</SelectItem>
              <SelectItem value={Level.advanced}>Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs 
        defaultValue="enrolled" 
        className="w-full"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enrolled">My Enrolled Courses</TabsTrigger>
          <TabsTrigger value="all">All Courses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="enrolled" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Clock className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Loading your courses...</p>
              </div>
            </div>
          ) : filteredEnrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <Book className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                {searchTerm || selectedCategory !== 'all' || selectedLevel !== 'all'
                  ? 'No matching courses found'
                  : 'No courses enrolled'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || selectedCategory !== 'all' || selectedLevel !== 'all'
                  ? 'Try adjusting your filters or try a different search term.'
                  : 'You haven\'t enrolled in any courses yet.'}
              </p>
              {(searchTerm || selectedCategory !== 'all' || selectedLevel !== 'all') && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLevel('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEnrolledCourses.map((studentCourse) => (
                <Card key={studentCourse.studentCourseId} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative w-full h-32 bg-gradient-to-r from-blue-500 to-purple-500">
                    {studentCourse.course.thumbnailUrl && (
                      <img 
                        src={studentCourse.course.thumbnailUrl} 
                        alt={studentCourse.course.courseName}
                        className="w-full h-full object-cover opacity-75"
                      />
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={getLevelColor(studentCourse.course.courseLevel)}>
                        {getLevelLabel(studentCourse.course.courseLevel)}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xl line-clamp-1">
                      {studentCourse.course.courseName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {studentCourse.course.description || 'No description available.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center text-sm">
                        <Book className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="truncate">{studentCourse.course.category?.categoryName || 'Uncategorized'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="truncate">Enrolled: {format(new Date(studentCourse.createdAt), 'PP')}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button 
                        variant="default" 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => viewCourseDetails(studentCourse.course.courseId)}
                      >
                        View Course
                      </Button>
                      
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
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => openReviewDialog(studentCourse)}
                        >
                          Rate & Review
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Clock className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Loading courses...</p>
              </div>
            </div>
          ) : filteredAllCourses.length === 0 ? (
            <div className="text-center py-12">
              <Book className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No courses found</h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your filters or try a different search term.
              </p>
              {(searchTerm || selectedCategory !== 'all' || selectedLevel !== 'all') && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLevel('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAllCourses.map((course) => {
                const isUserEnrolled = enrolledCourses.some(
                  sc => sc.course.courseId === course.courseId
                );
                
                return (
                  <Card key={course.courseId} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative w-full h-32 bg-gradient-to-r from-blue-500 to-purple-500">
                      {course.thumbnailUrl && (
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.courseName}
                          className="w-full h-full object-cover opacity-75"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className={getLevelColor(course.courseLevel)}>
                          {getLevelLabel(course.courseLevel)}
                        </Badge>
                      </div>
                      {isUserEnrolled && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-green-100 text-green-800">
                            Enrolled
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-xl line-clamp-1">
                        {course.courseName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {course.description || 'No description available.'}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="flex items-center text-sm">
                          <Book className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="truncate">{course.category?.categoryName || 'Uncategorized'}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="truncate">{course._count?.studentCourses || 0} students</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => viewCourseDetails(course.courseId)}
                      >
                        View Course
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
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
