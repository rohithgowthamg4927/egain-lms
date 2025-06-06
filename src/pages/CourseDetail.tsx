import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { getCourseById, updateCourse, deleteCourse, getBatches } from '@/lib/api';
import { Course, Level, Role } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Calendar, Edit, Trash, Users, Book, Star, Pencil, Plus, User } from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  const isInstructor = user?.role === Role.instructor;

  // Add state for checking if instructor is assigned to this course
  const [isInstructorAssigned, setIsInstructorAssigned] = useState(false);

  const parsedCourseId = courseId ? parseInt(courseId, 10) : undefined;

  // Fetch course details with proper access control
  const { data: course, isLoading: isCourseLoading, isError } = useQuery({
    queryKey: ['course', parsedCourseId],
    queryFn: async () => {
      if (!parsedCourseId) throw new Error('No course ID provided');
      const response = await getCourseById(parsedCourseId);
      if (!response.success) throw new Error(response.error || 'Failed to fetch course');
      return response.data;
    },
    enabled: !!parsedCourseId,
  });

  // Fetch batches with proper access control
  const { data: batches = [] } = useQuery({
    queryKey: ['courseBatches', parsedCourseId],
    queryFn: async () => {
      if (!parsedCourseId) throw new Error('No course ID provided');
      const response = await getBatches();
      if (!response.success) throw new Error(response.error || 'Failed to fetch batches');
      return response.data.filter((batch: any) => batch.courseId === parsedCourseId);
    },
    enabled: !!parsedCourseId,
  });

  // Check instructor assignment
  useEffect(() => {
    if (course && isInstructor && user?.userId) {
      const isAssigned = batches.some((batch: any) => batch.instructor?.userId === user.userId);
      setIsInstructorAssigned(isAssigned);
      
      if (!isAssigned) {
        toast({
          title: 'Access Denied',
          description: 'You are not assigned to this course',
          variant: 'destructive',
        });
        navigate('/courses');
      }
    }
  }, [course, batches, isInstructor, user?.userId, navigate, toast]);

  const handleEditCourse = () => {
    navigate(`/courses/edit/${courseId}`);
  };

  const handleDeleteCourse = async () => {
    if (!parsedCourseId) return;
    
    setIsDeleting(true);
    try {
      const response = await deleteCourse(parsedCourseId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Course deleted successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        navigate('/courses');
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete course',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isCourseLoading;

  const getLevelLabel = (level: Level): string => {
    const labels: Record<Level, string> = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };
    return labels[level] || level;
  };

  const getLevelColor = (level: Level): string => {
    const colors: Record<Level, string> = {
      'beginner': 'bg-green-100 text-green-800',
      'intermediate': 'bg-blue-100 text-blue-800',
      'advanced': 'bg-purple-100 text-purple-800'
    };
    return colors[level] || '';
  };

  // Helper function to check if instructor can access a batch
  const canAccessBatch = (batch: any) => {
    if (isAdmin) return true;
    if (!isInstructor || !user?.userId) return false;
    return batch.instructor?.userId === user.userId;
  };

  // Helper function to render batch link based on access
  const renderBatchLink = (batch: any) => {
    const canAccess = canAccessBatch(batch);
    if (canAccess) {
      return (
        <Link to={`/batches/${batch.batchId}`} className="text-primary hover:underline">
          {batch.batchName}
        </Link>
      );
    }
    return <span>{batch.batchName}</span>;
  };

  // Helper function to render instructor link based on access
  const renderInstructorLink = (instructor: any) => {
    if (isAdmin) {
      return (
        <Link to={`/instructors/${instructor.userId}`} className="text-primary hover:underline">
          {instructor.fullName}
        </Link>
      );
    }
    return <span>{instructor.fullName}</span>;
  };

  return (
    <div className="p-0">
      <BreadcrumbNav items={[
        { label: 'Courses', link: '/courses' },
        { label: course?.courseName || 'Course Details', link: `/courses/${courseId}` }
      ]} />
      
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/courses')}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
          {!isLoading && !isError && course && (isAdmin) && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleEditCourse}
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit Course
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    className="flex items-center gap-1"
                  >
                    <Trash className="h-4 w-4" />
                    Delete Course
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the course
                      and remove any associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteCourse}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading course details...</p>
        </div>
      ) : isError ? (
        <div className="flex justify-center items-center h-64">
          <p>Error loading course details. Please try again later.</p>
        </div>
      ) : !course ? (
        <div className="flex justify-center items-center h-64">
          <p>Course not found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">{course.courseName}</CardTitle>
                  <CardDescription>
                    Category: {course.category?.categoryName || 'Uncategorized'}
                  </CardDescription>
                </div>
                <Badge className={getLevelColor(course.courseLevel)}>
                  {getLevelLabel(course.courseLevel)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="batches">Batches</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">
                      {course.description || 'No description available.'}
                    </p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-500">Students</p>
                        <p className="font-medium">
                          {course._count?.studentCourses || 0}
                        </p>
                      </div>
                    </div>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <Book className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm text-gray-500">Batches</p>
                              <p className="font-medium">
                                {course._count?.batches || 0}
                              </p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px] p-2">
                          <div className="space-y-1">
                            <h4 className="font-medium">Active Batches</h4>
                            {course.batches && course.batches.length > 0 ? (
                              <ul className="list-disc list-inside text-sm">
                                {course.batches.map((batch) => (
                                  <li key={batch.batchId}>
                                    {batch.batchName}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No active batches</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="flex items-center gap-2 group">
                      <Star className="h-5 w-5 text-yellow-400 group-hover:fill-yellow-400" />
                      <div>
                        <p className="text-sm text-gray-500">Average Rating</p>
                        <p className="font-medium">{course.averageRating ? course.averageRating.toFixed(1) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="batches">
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold mb-4">Batches</h3>
                    {Array.isArray(batches) && batches.length > 0 ? (
                      <div className="space-y-3">
                        {batches.map((batch) => (
                          <Card key={batch.batchId} className="relative overflow-hidden">
                            <div className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold">
                                    {renderBatchLink(batch)}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Instructor: {renderInstructorLink(batch.instructor)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span>
                                    {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No batches have been created for this course yet.</p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews">
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold mb-4">Student Reviews</h3>
                    {Array.isArray(course.reviews) && course.reviews.length > 0 ? (
                      <div className="space-y-4">
                        {course.reviews.map((review) => (
                          <Card key={review.reviewId} className="overflow-hidden">
                            <div className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                    {review.userId ? String(review.userId).charAt(0) : 'S'}
                                  </div>
                                  <div>
                                    <p className="font-medium">Student {review.userId || 'Anonymous'}</p>
                                    <div className="flex items-center">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              {review.review && (
                                <div className="mt-2 text-gray-700">
                                  <p>{review.review}</p>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No reviews yet for this course.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;
