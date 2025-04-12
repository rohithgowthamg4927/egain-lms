
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Clock, Link2, Trash2, Video, Plus, Edit, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getAllSchedules, createSchedule, deleteSchedule, updateSchedule } from '@/lib/api';
import { Schedule } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const formSchema = z.object({
  topic: z.string().min(1, { message: 'Topic is required' }),
  scheduleDate: z.string().min(1, { message: 'Date is required' }),
  startTime: z.string().min(1, { message: 'Start time is required' }),
  endTime: z.string().min(1, { message: 'End time is required' }),
  platform: z.string().optional(),
  meetingLink: z.string().url({ message: 'Invalid URL' }).optional().or(z.literal('')),
  description: z.string().optional(),
});

interface BatchSchedulesProps {
  batchId: number;
  isInstructor: boolean;
  isAdmin: boolean;
}

const BatchSchedules = ({ batchId, isInstructor, isAdmin }: BatchSchedulesProps) => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canEditSchedules = isAdmin || isInstructor;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      scheduleDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: '',
      endTime: '',
      platform: '',
      meetingLink: '',
      description: '',
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      scheduleDate: '',
      startTime: '',
      endTime: '',
      platform: '',
      meetingLink: '',
      description: '',
    },
  });

  useEffect(() => {
    fetchSchedules();
  }, [batchId]);

  useEffect(() => {
    if (currentSchedule && isEditDialogOpen) {
      const scheduleDate = format(new Date(currentSchedule.scheduleDate), 'yyyy-MM-dd');
      const startTime = format(new Date(currentSchedule.startTime), 'HH:mm');
      const endTime = format(new Date(currentSchedule.endTime), 'HH:mm');
      
      editForm.reset({
        topic: currentSchedule.topic || '',
        scheduleDate,
        startTime,
        endTime,
        platform: currentSchedule.platform || '',
        meetingLink: currentSchedule.meetingLink || '',
        description: currentSchedule.description || '',
      });
    }
  }, [currentSchedule, isEditDialogOpen, editForm]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await getAllSchedules({ batchId });
      if (response.success && response.data) {
        // Sort schedules by date
        const sortedSchedules = response.data.sort((a, b) => {
          return new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime();
        });
        setSchedules(sortedSchedules);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch schedules',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const scheduleData = {
        batchId,
        topic: values.topic,
        startTime: values.startTime,
        endTime: values.endTime,
        scheduleDate: values.scheduleDate,
        meetingLink: values.meetingLink || null,
        platform: values.platform || null,
        description: values.description || null,
      };

      const response = await createSchedule(scheduleData);
      
      if (response.success) {
        toast({
          title: 'Schedule created',
          description: 'Schedule has been created successfully',
        });
        setIsCreateDialogOpen(false);
        form.reset();
        fetchSchedules();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const onEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentSchedule) return;
    
    try {
      const scheduleData = {
        topic: values.topic,
        startTime: values.startTime,
        endTime: values.endTime,
        scheduleDate: values.scheduleDate,
        meetingLink: values.meetingLink || null,
        platform: values.platform || null,
        description: values.description || null,
      };

      const response = await updateSchedule(currentSchedule.scheduleId, scheduleData);
      
      if (response.success) {
        toast({
          title: 'Schedule updated',
          description: 'Schedule has been updated successfully',
        });
        setIsEditDialogOpen(false);
        setCurrentSchedule(null);
        fetchSchedules();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSchedule = async () => {
    if (!currentSchedule) return;
    
    try {
      const response = await deleteSchedule(currentSchedule.scheduleId);
      
      if (response.success) {
        toast({
          title: 'Schedule deleted',
          description: 'Schedule has been deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setCurrentSchedule(null);
        fetchSchedules();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), 'h:mm a');
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEditSchedules && (
        <div className="flex justify-end mb-4">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Schedule</DialogTitle>
                <DialogDescription>
                  Create a new schedule for this batch.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter topic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scheduleDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="platform"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Zoom">Zoom</SelectItem>
                            <SelectItem value="Google Meet">Google Meet</SelectItem>
                            <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                            <SelectItem value="Classroom">Classroom</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meetingLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Link (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Schedule</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {schedules.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No schedules added for this batch yet.</p>
          {canEditSchedules && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.scheduleId} className="overflow-hidden border-gray-200">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-lg">{schedule.topic || 'Untitled Schedule'}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(schedule.scheduleDate)}</span>
                        <span className="mx-2">•</span>
                        <Clock className="h-4 w-4 mr-1" />
                        <span>
                          {formatDateTime(schedule.startTime)} - {formatDateTime(schedule.endTime)}
                        </span>
                      </div>
                    </div>

                    {schedule.platform && (
                      <div className="flex items-center text-sm">
                        <Video className="h-4 w-4 mr-2 text-blue-600" />
                        <span>{schedule.platform}</span>
                      </div>
                    )}

                    {schedule.meetingLink && (
                      <div className="flex items-center text-sm">
                        <Link2 className="h-4 w-4 mr-2 text-blue-600" />
                        <a
                          href={schedule.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          Join Meeting <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    )}

                    {schedule.description && (
                      <div className="mt-2 text-sm text-gray-700">{schedule.description}</div>
                    )}
                  </div>

                  {canEditSchedules && (
                    <div className="flex space-x-2 md:self-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setCurrentSchedule(schedule);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setCurrentSchedule(schedule);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update this schedule's details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter topic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="scheduleDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Zoom">Zoom</SelectItem>
                        <SelectItem value="Google Meet">Google Meet</SelectItem>
                        <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                        <SelectItem value="Classroom">Classroom</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="meetingLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Link (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Update Schedule</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSchedule}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BatchSchedules;
