
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { createCourse } from '@/lib/api/courses';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CourseForm from '@/components/courses/CourseForm';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

const AddCourse = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const response = await createCourse(formData);
      
      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: 'Course created successfully',
        });
        navigate(`/courses/${response.data.courseId}`);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create course',
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
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-0">
      <BreadcrumbNav items={[
        { label: 'Courses', link: '/courses' },
        { label: 'Add Course', link: '/courses/add' }
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
          <h1 className="text-3xl font-bold">Add New Course</h1>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-6">
        <CourseForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default AddCourse;
