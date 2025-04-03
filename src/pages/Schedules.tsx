import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
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
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getBatches } from '@/lib/api';
import { getAllSchedules, createSchedule, updateSchedule, deleteSchedule } from '@/lib/api/schedules';
import { Schedule, Batch } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, Check, ChevronDown, Edit, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const filterSchema = z.object({
  batch: z.number().optional(),
  date: z.date().optional(),
});

const formSchema = z.object({
  batchId: z.number().min(1, {
    message: 'Please select a batch.',
  }),
  topic: z.string().min(2, {
    message: 'Topic must be at least 2 characters.',
  }),
  startTime: z.string().min(1, {
    message: 'Please select a start time.',
  }),
  endTime: z.string().min(1, {
    message: 'Please select an end time.',
  }),
  meetingLink: z.string().optional(),
  description: z.string().optional(),
});

const Schedules = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const { toast } = useToast();

  const defaultValues: z.infer<typeof filterSchema> = {
    batch: Number(searchParams.get('batch')) || undefined,
    date: searchParams.get('date') ? new Date(searchParams.get('date') as string) : undefined,
  };

  const [filters, setFilters] = useState(defaultValues);

  const filterForm = useForm<z.infer<typeof filterSchema>>({
    resolver: zodResolver(filterSchema),
    defaultValues: filters,
    mode: 'onChange',
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      batchId: 0,
      topic: '',
      startTime: '',
      endTime: '',
      meetingLink: '',
      description: '',
    },
  });

  const handleFilterChange = (values: z.infer<typeof filterSchema>): void => {
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

    if (filters.date && !formatDate(schedule.startTime).includes(format(filters.date, 'yyyy-MM-dd'))) {
      return false;
    }

    return true;
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsCreating(true);

    try {
      if (!values.batchId) {
        toast({
          title: 'Error',
          description: 'Batch ID is required',
          variant: 'destructive',
        });
        setIsCreating(false);
        return;
      }

      const scheduleInput = {
        batchId: values.batchId,
        topic: values.topic,
        startTime: values.startTime,
        endTime: values.endTime,
        meetingLink: values.meetingLink || null,
        description: values.description || null,
      };

      const response = await createSchedule(scheduleInput);

      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: 'Schedule created successfully',
        });
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
      toast({
        title: 'Error',
        description: 'Failed to create schedule',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const onUpdate = async (values: z.infer<typeof formSchema>) => {
    setIsUpdating(true);

    try {
      if (!selectedSchedule) {
        toast({
          title: 'Error',
          description: 'No schedule selected',
          variant: 'destructive',
        });
        return;
      }

      const response = await updateSchedule(selectedSchedule.scheduleId, values);

      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: 'Schedule updated successfully',
        });
        form.reset();
        fetchSchedules();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update schedule',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update schedule',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onDelete = async () => {
    setIsDeleting(true);

    try {
      if (!selectedSchedule) {
        toast({
          title: 'Error',
          description: 'No schedule selected',
          variant: 'destructive',
        });
        return;
      }

      const response = await deleteSchedule(selectedSchedule.scheduleId);

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Schedule deleted successfully',
        });
        form.reset();
        fetchSchedules();
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
        description: 'Failed to delete schedule',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isSelected = (batchId: number) => {
    return filters.batch === batchId;
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Schedules</h1>
          <p className="text-muted-foreground">Manage your class schedules</p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Schedule</DialogTitle>
                <DialogDescription>
                  Create a new class schedule.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="batchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batch</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))}>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" onClick={fetchSchedules} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
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
                              <CommandEmpty>No batch found.</CommandEmpty>
                              <CommandGroup>
                                {batches.map((schedule) => (
                                  <CommandItem
                                    key={schedule.batchId}
                                    onSelect={() => {
                                      filterForm.setValue('batch', schedule.batchId);
                                      filterForm.handleSubmit(handleFilterChange)();
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        isSelected(schedule.batchId) ? 'opacity-100' : 'opacity-0'
                                      )}
                                    />
                                    {schedule.batchName}
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
                                formatDate(field.value)
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              filterForm.handleSubmit(handleFilterChange)();
                            }}
                            disabled={(date) => date > new Date() }
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
          <CardTitle>Schedules</CardTitle>
          <CardDescription>List of all class schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
              Loading schedules...
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              No schedules found.
            </div>
          ) : (
            <ScrollArea>
              <Table>
                <TableCaption>List of all class schedules</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.scheduleId}>
                      <TableCell>{batches.find((batch) => batch.batchId === schedule.batchId)?.batchName}</TableCell>
                      <TableCell>{schedule.topic}</TableCell>
                      <TableCell>{format(new Date(schedule.startTime), 'yyyy-MM-dd HH:mm')}</TableCell>
                      <TableCell>{format(new Date(schedule.endTime), 'yyyy-MM-dd HH:mm')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Edit Schedule</DialogTitle>
                                <DialogDescription>
                                  Edit an existing class schedule.
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...form}>
                                <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-4">
                                  <FormField
                                    control={form.control}
                                    name="batchId"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Batch</FormLabel>
                                        <Select onValueChange={(value) => field.onChange(Number(value))}>
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
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name="startTime"
                                      render={({ field }) => (
                                        <FormItem className="col-span-1">
                                          <FormLabel>Start Time</FormLabel>
                                          <FormControl>
                                            <Input type="datetime-local" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name="endTime"
                                      render={({ field }) => (
                                        <FormItem className="col-span-1">
                                          <FormLabel>End Time</FormLabel>
                                          <FormControl>
                                            <Input type="datetime-local" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
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
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Enter description" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <Button type="submit" disabled={isUpdating}>
                                    {isUpdating ? (
                                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Edit className="h-4 w-4 mr-2" />
                                    )}
                                    Update
                                  </Button>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Delete Schedule</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete this schedule? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button type="button" variant="secondary">
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  onClick={onDelete}
                                  disabled={isDeleting}
                                >
                                  {isDeleting ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Delete
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedules;

function FormLabel(props: React.HTMLAttributes<HTMLLabelElement>) {
  return (
    <Label
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', props.className)}
      {...props}
    />
  );
}
