
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getBatches } from '@/lib/api';
import { getAllSchedules, createSchedule, updateSchedule, deleteSchedule } from '@/lib/api/schedules';
import { Schedule, Batch, User } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  CalendarIcon, 
  Check, 
  ChevronDown, 
  Clock, 
  Edit, 
  Plus, 
  RefreshCw, 
  Save, 
  Trash2, 
  X 
} from 'lucide-react';
import { format, addHours, isWithinInterval, parseISO, isSameDay } from 'date-fns';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';

const PLATFORM_OPTIONS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'google-meet', label: 'Google Meet' },
  { value: 'microsoft-teams', label: 'Microsoft Teams' },
  { value: 'other', label: 'Other' },
];

const TIME_SLOTS = Array.from({ length: 24 * 4 }).map((_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return {
    value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  };
});

const filterSchema = z.object({
  batch: z.number().optional(),
  date: z.date().optional(),
});

const scheduleItemSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  startTime: z.string({
    required_error: "Please select a start time",
  }),
  endTime: z.string({
    required_error: "Please select an end time",
  }),
});

const scheduleFormSchema = z.object({
  batchId: z.number({
    required_error: "Please select a batch",
  }),
  topic: z.string().min(2, { 
    message: "Topic must be at least 2 characters long" 
  }),
  meetingLink: z.string().optional(),
  platform: z.string({
    required_error: "Please select a platform",
  }),
  description: z.string().optional(),
  schedules: z.array(scheduleItemSchema).min(1, {
    message: "Add at least one schedule"
  }),
});

type FilterFormValues = z.infer<typeof filterSchema>;
type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

const Schedules = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchInstructors, setBatchInstructors] = useState<Record<number, User>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedBatchForAdd, setSelectedBatchForAdd] = useState<Batch | null>(null);
  const { toast } = useToast();

  const defaultValues: FilterFormValues = {
    batch: Number(searchParams.get('batch')) || undefined,
    date: searchParams.get('date') ? new Date(searchParams.get('date') as string) : undefined,
  };

  const [filters, setFilters] = useState(defaultValues);

  const filterForm = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: filters,
    mode: 'onChange',
  });

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      batchId: 0,
      topic: '',
      meetingLink: '',
      platform: '',
      description: '',
      schedules: [
        { 
          date: new Date(),
          startTime: '09:00',
          endTime: '10:30',
        }
      ]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedules"
  });

  const watchBatchId = form.watch("batchId");

  useEffect(() => {
    if (watchBatchId) {
      const selectedBatch = batches.find(batch => batch.batchId === watchBatchId);
      setSelectedBatchForAdd(selectedBatch || null);
    }
  }, [watchBatchId, batches]);

  // Function to get date validation constraints based on batch
  const getBatchDateConstraints = (batchId: number) => {
    const batch = batches.find(b => b.batchId === batchId);
    if (!batch) return { minDate: new Date(), maxDate: addHours(new Date(), 24) };

    return {
      minDate: new Date(batch.startDate),
      maxDate: new Date(batch.endDate)
    };
  };

  // Determine if a date is within the batch period
  const isDateInBatchPeriod = (date: Date, batchId: number) => {
    const { minDate, maxDate } = getBatchDateConstraints(batchId);
    return isWithinInterval(date, { start: minDate, end: maxDate });
  };

  const handleFilterChange = (values: FilterFormValues): void => {
    setFilters(values);

    const params = new URLSearchParams();

    if (values.batch) {
      params.set('batch', String(values.batch));
    } else {
      params.delete('batch');
    }

    if (values.date) {
      params.set('date', format(values.date, 'yyyy-MM-dd'));
    } else {
      params.delete('date');
    }

    setSearchParams(params);
  };

  const fetchSchedules = async () => {
    setIsLoading(true);

    try {
      const response = await getAllSchedules();

      if (response.success && response.data) {
        setSchedules(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch schedules',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch schedules',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await getBatches();

      if (response.success && response.data) {
        setBatches(response.data);
        
        // Create a map of batch instructors
        const instructorsMap: Record<number, User> = {};
        response.data.forEach(batch => {
          if (batch.instructor && batch.batchId) {
            instructorsMap[batch.batchId] = batch.instructor;
          }
        });
        setBatchInstructors(instructorsMap);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch batches',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch batches',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchBatches();
  }, []);

  useEffect(() => {
    filterForm.setValue('batch', Number(searchParams.get('batch')) || undefined);
    filterForm.setValue('date', searchParams.get('date') ? new Date(searchParams.get('date') as string) : undefined);
  }, [searchParams, filterForm]);

  const filteredSchedules = schedules.filter((schedule) => {
    if (filters.batch && schedule.batchId !== filters.batch) {
      return false;
    }

    if (filters.date) {
      try {
        const scheduleDate = new Date(schedule.startTime);
        return isSameDay(scheduleDate, filters.date);
      } catch (error) {
        return false;
      }
    }

    return true;
  });

  const handleAddSchedule = () => {
    append({ date: new Date(), startTime: '09:00', endTime: '10:30' });
  };

  const onSubmit = async (values: ScheduleFormValues) => {
    setIsSubmitting(true);
    let successCount = 0;
    const totalSchedules = values.schedules.length;
    
    try {
      // Create each schedule
      for (const scheduleItem of values.schedules) {
        // Combine date and time for startTime and endTime
        const scheduleDate = scheduleItem.date;
        
        // Create start time by combining date with time
        const startParts = scheduleItem.startTime.split(':');
        const startDate = new Date(scheduleDate);
        startDate.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0, 0);
        
        // Create end time by combining date with time
        const endParts = scheduleItem.endTime.split(':');
        const endDate = new Date(scheduleDate);
        endDate.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0, 0);
        
        const scheduleInput = {
          batchId: values.batchId,
          topic: values.topic,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          meetingLink: values.meetingLink || null,
          platform: values.platform || null,
          description: values.description || null
        };

        const response = await createSchedule(scheduleInput);

        if (response.success) {
          successCount++;
        } else {
          toast({
            title: 'Error',
            description: response.error || `Failed to create schedule ${successCount + 1}`,
            variant: 'destructive',
          });
        }
      }
      
      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `Created ${successCount}/${totalSchedules} schedules successfully`,
        });
        
        // Only close dialog and reset form if all schedules were created successfully
        if (successCount === totalSchedules) {
          setShowAddDialog(false);
          form.reset();
        }
        
        fetchSchedules(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while creating schedules',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    try {
      const response = await deleteSchedule(scheduleId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Schedule deleted successfully',
        });
        fetchSchedules(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while deleting the schedule',
        variant: 'destructive',
      });
    }
  };

  const isSelected = (batchId: number) => {
    return filters.batch === batchId;
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Schedules</h1>
          <p className="text-muted-foreground">Manage your class schedules</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
          <Button 
            onClick={fetchSchedules} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter schedules by batch and date</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...filterForm}>
            <form className="space-y-4" onSubmit={filterForm.handleSubmit(handleFilterChange)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={filterForm.control}
                  name="batch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                'w-full justify-between',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value
                                ? batches.find((batch) => batch.batchId === field.value)?.batchName
                                : 'Select batch'}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandList>
                              <CommandEmpty>No batches found.</CommandEmpty>
                              <CommandGroup>
                                {batches.map((batch) => (
                                  <CommandItem
                                    key={batch.batchId}
                                    onSelect={() => {
                                      filterForm.setValue('batch', batch.batchId);
                                      filterForm.handleSubmit(handleFilterChange)();
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        isSelected(batch.batchId) ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    {batch.batchName}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                              {filters.batch && (
                                <>
                                  <CommandSeparator />
                                  <CommandItem
                                    onSelect={() => {
                                      filterForm.setValue('batch', undefined);
                                      filterForm.handleSubmit(handleFilterChange)();
                                    }}
                                    className="justify-center text-sm"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear
                                  </CommandItem>
                                </>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={filterForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              filterForm.handleSubmit(handleFilterChange)();
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule List</CardTitle>
          <CardDescription>View and manage all class schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
              <span>Loading schedules...</span>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
              <div className="text-muted-foreground">No schedules found</div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Schedule
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableCaption>A list of all class schedules.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule) => {
                    const scheduleBatch = batches.find(b => b.batchId === schedule.batchId);
                    const scheduleDate = new Date(schedule.startTime);
                    const scheduleStartTime = format(new Date(schedule.startTime), 'HH:mm');
                    const scheduleEndTime = format(new Date(schedule.endTime), 'HH:mm');
                    
                    return (
                      <TableRow key={schedule.scheduleId}>
                        <TableCell>
                          {scheduleBatch?.batchName || 'Unknown Batch'}
                        </TableCell>
                        <TableCell>
                          {format(scheduleDate, 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {`${scheduleStartTime} - ${scheduleEndTime}`}
                        </TableCell>
                        <TableCell>
                          {schedule.topic || 'No Topic'}
                        </TableCell>
                        <TableCell>
                          {batchInstructors[schedule.batchId || 0]?.fullName || 'Unknown Instructor'}
                        </TableCell>
                        <TableCell>
                          {schedule.platform ? (
                            <Badge variant="outline">
                              {schedule.platform}
                            </Badge>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleDeleteSchedule(schedule.scheduleId)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add Schedule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Schedule</DialogTitle>
            <DialogDescription>
              Create one or multiple schedule entries for classes.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Batch Selection */}
                <FormField
                  control={form.control}
                  name="batchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Batch</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a batch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {batches.map((batch) => (
                            <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                              {batch.batchName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Instructor (Auto-populated) */}
                <FormItem>
                  <FormLabel>Instructor</FormLabel>
                  <Input 
                    value={selectedBatchForAdd?.instructor?.fullName || "No instructor assigned"}
                    disabled
                    className="bg-gray-100"
                  />
                </FormItem>
              </div>
              
              {/* Topic */}
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter topic for the class" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Platform and Meeting Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          {PLATFORM_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
              </div>
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter class description or agenda" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Schedule Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg">Schedule Sessions</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSchedule}
                    disabled={!watchBatchId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add More Sessions
                  </Button>
                </div>
                
                <Card>
                  <CardContent className="pt-6">
                    {fields.map((item, index) => (
                      <div key={item.id} className="flex flex-col space-y-4 mb-6 pb-6 border-b last:border-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Session {index + 1}</h4>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Date Selector */}
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.date`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                        disabled={!watchBatchId}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => watchBatchId && !isDateInBatchPeriod(date, watchBatchId)}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Start Time */}
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.startTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select start time" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {TIME_SLOTS.map((slot) => (
                                      <SelectItem key={`start-${index}-${slot.value}`} value={slot.value}>
                                        {slot.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* End Time */}
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.endTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select end time" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {TIME_SLOTS.map((slot) => (
                                      <SelectItem key={`end-${index}-${slot.value}`} value={slot.value}>
                                        {slot.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting || !watchBatchId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Schedules
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedules;
