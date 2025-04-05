import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Schedule, Batch } from '@/lib/types';

type ScheduleFormProps = {
  batches: Batch[];
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  defaultValues?: Partial<Schedule>;
};

const ScheduleForm = ({ 
  batches, 
  onSubmit, 
  isSubmitting, 
  defaultValues 
}: ScheduleFormProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    defaultValues?.scheduleDate ? new Date(defaultValues.scheduleDate) : new Date()
  );
  const [selectedBatch, setSelectedBatch] = useState<Batch | undefined>(
    defaultValues?.batchId 
      ? batches.find(b => b.batchId === defaultValues.batchId)
      : undefined
  );
  
  const [minDate, setMinDate] = useState<Date | undefined>(undefined);
  const [maxDate, setMaxDate] = useState<Date | undefined>(undefined);

  const form = useForm({
    defaultValues: {
      batchId: defaultValues?.batchId ? String(defaultValues.batchId) : '',
      topic: defaultValues?.topic || '',
      platform: defaultValues?.platform || 'Zoom',
      startTime: defaultValues?.startTime ? defaultValues.startTime.substring(0, 5) : '09:00',
      endTime: defaultValues?.endTime ? defaultValues.endTime.substring(0, 5) : '10:00',
      meetingLink: defaultValues?.meetingLink || '',
      scheduleDate: defaultValues?.scheduleDate || format(new Date(), 'yyyy-MM-dd'),
      description: defaultValues?.description || '',
    },
  });

  useEffect(() => {
    const batchId = form.watch('batchId');
    if (batchId) {
      const batch = batches.find(b => b.batchId === parseInt(batchId));
      setSelectedBatch(batch);
      
      if (batch?.startDate && batch?.endDate) {
        setMinDate(new Date(batch.startDate));
        setMaxDate(new Date(batch.endDate));
        
        if (selectedDate) {
          const currentDate = new Date(selectedDate);
          const startDate = new Date(batch.startDate);
          const endDate = new Date(batch.endDate);
          
          if (currentDate < startDate || currentDate > endDate) {
            setSelectedDate(startDate);
            form.setValue('scheduleDate', format(startDate, 'yyyy-MM-dd'));
          }
        }
      }
    } else {
      setMinDate(undefined);
      setMaxDate(undefined);
    }
  }, [form.watch('batchId'), batches]);

  const handleFormSubmit = (data: any) => {
    const formattedData = {
      ...data,
      batchId: parseInt(data.batchId, 10),
      scheduleDate: format(selectedDate || new Date(), 'yyyy-MM-dd'),
    };
    onSubmit(formattedData);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      form.setValue('scheduleDate', format(date, 'yyyy-MM-dd'));
    }
  };

  const isDateDisabled = (date: Date) => {
    if (!minDate || !maxDate) return false;
    
    return date < minDate || date > maxDate;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="batchId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.batchId} value={String(batch.batchId)}>
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

          <FormField
            control={form.control}
            name="scheduleDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
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
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={isDateDisabled}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {selectedBatch && minDate && maxDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Batch period: {format(minDate, 'MMM d, yyyy')} - {format(maxDate, 'MMM d, yyyy')}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

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
                    <SelectItem value="In Person">In Person</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 opacity-50" />
                    <Input type="time" {...field} />
                  </div>
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
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 opacity-50" />
                    <Input type="time" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="meetingLink"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Meeting Link</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : defaultValues?.scheduleId ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ScheduleForm;
