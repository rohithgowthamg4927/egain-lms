import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getCourseById, updateCourse } from '@/lib/api/courses';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CourseForm from '@/components/courses/CourseForm';

const EditCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseQuery = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseById(Number(courseId)),
    enabled: !!courseId,
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

  return (
    <div className="p-0">
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
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <CourseForm 
            course={course}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
};

export default EditCourse;
