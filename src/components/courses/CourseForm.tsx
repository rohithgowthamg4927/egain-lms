import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Level } from '@/lib/types';

// Course form schema
const courseFormSchema = z.object({
  courseName: z.string().min(3, { message: 'Course name must be at least 3 characters' }),
  description: z.string().optional(),
  courseLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  categoryId: z.string().min(1, { message: 'Please select a category' }),
  isPublished: z.boolean().default(false),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface CourseFormProps {
  course?: any;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const CourseForm = ({ course, onSubmit, isSubmitting }: CourseFormProps) => {
  // Fetch categories
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });
  
  const categories = categoriesResponse?.data || [];

  // Setup form with default values
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      courseName: course?.courseName || '',
      description: course?.description || '',
      courseLevel: course?.courseLevel || 'beginner',
      categoryId: course?.categoryId ? course.categoryId.toString() : '',
      isPublished: course?.isPublished || false,
    }
  });

  // Update form when course data is loaded
  useEffect(() => {
    if (course) {
      form.reset({
        courseName: course.courseName,
        description: course.description || '',
        courseLevel: course.courseLevel,
        categoryId: course.categoryId.toString(),
        isPublished: course.isPublished,
      });
    }
  }, [course, form]);

  const handleFormSubmit = (values: CourseFormValues) => {
    onSubmit({
      ...values,
      categoryId: parseInt(values.categoryId),
    });
  };

  if (isLoadingCategories) {
    return <div>Loading categories...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="courseName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter course name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                        {category.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courseLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={Level.beginner}>Beginner</SelectItem>
                    <SelectItem value={Level.intermediate}>Intermediate</SelectItem>
                    <SelectItem value={Level.advanced}>Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter course description" 
                  className="min-h-32"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Published</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Make this course visible to students
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting 
              ? (course ? 'Updating...' : 'Creating...') 
              : (course ? 'Update Course' : 'Create Course')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CourseForm;
