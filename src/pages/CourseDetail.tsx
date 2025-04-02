
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getCourseById } from '@/lib/api/courses';
import { Course, Level } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Calendar, Edit, Trash, Users, Book, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CourseForm from '@/components/courses/CourseForm';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseById(Number(courseId)),
    enabled: !!courseId,
  });

  const handleEditSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // This would be handled in the future
      toast({
        title: 'Not Implemented',
        description: 'Course editing will be implemented in a future update',
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    toast({
      title: 'Not Implemented',
      description: 'Course deletion will be implemented in a future update',
    });
  };

  const isLoading = courseQuery.isLoading;
  const isError = courseQuery.isError;
  const course = courseQuery.data?.data;

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

  return (
    <Layout>
      <div className="p-0">
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
            {!isLoading && !isError && course && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(true)}
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
                      <AlertDialogAction onClick={handleDeleteSubmit}>
                        Delete
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
                <div className="py-4">
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
                      <p className="font-medium">{course.students || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Book className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Batches</p>
                      <p className="font-medium">{course.batches?.length || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-sm text-gray-500">Average Rating</p>
                      <p className="font-medium">{course.averageRating?.toFixed(1) || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="pt-2">
                  <h3 className="text-lg font-semibold mb-4">Batches</h3>
                  {course.batches && course.batches.length > 0 ? (
                    <div className="space-y-3">
                      {course.batches.map((batch) => (
                        <Card key={batch.batchId} className="relative overflow-hidden">
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold">{batch.batchName}</h4>
                                <p className="text-sm text-gray-500">
                                  Instructor: {batch.instructor?.fullName || 'Not assigned'}
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
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update the course information below.
            </DialogDescription>
          </DialogHeader>
          {course && (
            <CourseForm 
              course={course}
              onSubmit={handleEditSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CourseDetail;
