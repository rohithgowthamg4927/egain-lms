
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getCourseById, updateCourse } from '@/lib/api/courses';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CourseForm from '@/components/courses/CourseForm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

const EditCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseById(Number(courseId)),
  });

  const handleSubmit = async (formData: any) => {
    if (!courseId) return;
    
    setIsSubmitting(true);
    try {
      const response = await updateCourse(Number(courseId), formData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Course updated successfully',
        });
        
        // Invalidate and refetch relevant queries
        queryClient.invalidateQueries({
          queryKey: ['course', courseId]
        });
        
        queryClient.invalidateQueries({
          queryKey: ['courses']
        });
        
        navigate(`/courses/${courseId}`);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update course',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = courseQuery.isLoading;
  const isError = courseQuery.isError;
  const course = courseQuery.data?.data;

  if (isError) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-bold text-destructive">Error loading course data</h2>
        <p className="mt-2 text-muted-foreground">Please try again later or contact support</p>
        <Button className="mt-4" onClick={() => navigate('/courses')}>
          Return to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="p-0">
      <BreadcrumbNav items={[
        { label: 'Courses', link: '/courses' },
        { label: course?.courseName || 'Course Details', link: `/courses/${courseId}` },
        { label: 'Edit Course', link: `/courses/edit/${courseId}` }
      ]} />
      
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/courses/${courseId}`)}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Button>
          <h1 className="text-3xl font-bold">Edit Course</h1>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        ) : (
          <CourseForm 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            course={course}
          />
        )}
      </div>
    </div>
  );
};

export default EditCourse;
