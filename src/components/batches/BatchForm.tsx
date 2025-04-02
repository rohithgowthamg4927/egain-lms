
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { getCourses } from '@/lib/api/courses';
import { getUsers } from '@/lib/api/users';
import { Batch, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Define the form schema
const batchFormSchema = z.object({
  batchName: z.string().min(3, { message: 'Batch name must be at least 3 characters' }),
  courseId: z.string().min(1, { message: 'Please select a course' }),
  instructorId: z.string().min(1, { message: 'Please select an instructor' }),
  startDate: z.string().min(1, { message: 'Please select a start date' }),
  endDate: z.string().min(1, { message: 'Please select an end date' })
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

interface BatchFormProps {
  batch?: Batch;
  onSubmit: (data: BatchFormValues) => void;
  isSubmitting: boolean;
}

const BatchForm = ({ batch, onSubmit, isSubmitting }: BatchFormProps) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Fetch courses
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: () => getCourses()
  });

  // Fetch instructors
  const instructorsQuery = useQuery({
    queryKey: ['instructors'],
    queryFn: () => getUsers(Role.instructor)
  });

  const courses = coursesQuery.data?.data || [];
  const instructors = instructorsQuery.data?.data || [];
  const isLoading = coursesQuery.isLoading || instructorsQuery.isLoading;

  // Initialize form with default values
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      batchName: batch?.batchName || '',
      courseId: batch?.courseId.toString() || '',
      instructorId: batch?.instructorId.toString() || '',
      startDate: batch?.startDate ? new Date(batch.startDate).toISOString().split('T')[0] : '',
      endDate: batch?.endDate ? new Date(batch.endDate).toISOString().split('T')[0] : ''
    }
  });

  // Update form when batch data is loaded
  useEffect(() => {
    if (batch) {
      const startDateStr = new Date(batch.startDate).toISOString().split('T')[0];
      const endDateStr = new Date(batch.endDate).toISOString().split('T')[0];
      
      form.reset({
        batchName: batch.batchName,
        courseId: batch.courseId.toString(),
        instructorId: batch.instructorId.toString(),
        startDate: startDateStr,
        endDate: endDateStr
      });
      
      setStartDate(startDateStr);
      setEndDate(endDateStr);
    }
  }, [batch, form]);

  const handleFormSubmit = (values: BatchFormValues) => {
    onSubmit({
      ...values,
      courseId: parseInt(values.courseId),
      instructorId: parseInt(values.instructorId)
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="batchName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter batch name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.courseId} value={course.courseId.toString()}>
                        {course.courseName}
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
            name="instructorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructor</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an instructor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.userId} value={instructor.userId.toString()}>
                        {instructor.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      field.onChange(e);
                      setStartDate(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    min={startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      field.onChange(e);
                      setEndDate(e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting 
              ? (batch ? 'Updating...' : 'Creating...') 
              : (batch ? 'Update Batch' : 'Create Batch')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BatchForm;
