
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getCourses } from '@/lib/api/courses';
import { getUsers } from '@/lib/api/users';
import { Batch, User, Role } from '@/lib/types';

type BatchFormProps = {
  batch?: Batch;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
};

const BatchForm = ({ batch, onSubmit, isSubmitting }: BatchFormProps) => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    batch?.startDate ? new Date(batch.startDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    batch?.endDate ? new Date(batch.endDate) : undefined
  );

  const form = useForm({
    defaultValues: {
      batchName: batch?.batchName || '',
      description: batch?.description || '',
      courseId: batch?.courseId ? String(batch.courseId) : '',
      instructorId: batch?.instructorId ? String(batch.instructorId) : '',
      capacity: batch?.capacity ? String(batch.capacity) : '',
      startDate: batch?.startDate || '',
      endDate: batch?.endDate || '',
      meetingLink: batch?.meetingLink || '',
      schedule: batch?.schedule || '',
    },
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  const { data: instructorsData } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => getUsers(Role.instructor),
  });

  const courses = coursesData?.data || [];
  const instructors = instructorsData?.data || [];

  useEffect(() => {
    if (startDate) {
      form.setValue('startDate', format(startDate, 'yyyy-MM-dd'));
    }
  }, [startDate, form]);

  useEffect(() => {
    if (endDate) {
      form.setValue('endDate', format(endDate, 'yyyy-MM-dd'));
    }
  }, [endDate, form]);

  const handleSubmit = (data: any) => {
    // Convert string IDs to numbers for API submission
    const formattedData = {
      ...data,
      courseId: parseInt(data.courseId, 10),
      instructorId: parseInt(data.instructorId, 10),
      capacity: parseInt(data.capacity, 10),
    };
    onSubmit(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={String(course.id)}>
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
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an instructor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {instructors.map((instructor: User) => (
                      <SelectItem key={instructor.id} value={String(instructor.id)}>
                        {instructor.name}
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
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter capacity" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meetingLink"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meeting Link</FormLabel>
                <FormControl>
                  <Input placeholder="Enter meeting link" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="schedule"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Schedule (e.g., Mon, Wed, Fri 10AM-12PM)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter schedule information" {...field} />
                </FormControl>
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
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter batch description"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : batch ? 'Update Batch' : 'Create Batch'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BatchForm;
