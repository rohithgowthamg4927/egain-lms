import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Plus, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Schedule, Batch } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@/lib/types';

type ScheduleFormProps = {
  batches: Batch[];
  onSubmit: (data: any) => void;
  onSubmitMultiple?: (data: any[]) => void;
  isSubmitting: boolean;
  defaultValues?: Partial<Schedule>;
  supportMultiple?: boolean;
};

interface ScheduleSession {
  id: string;
  topic: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
}

const ScheduleForm = ({ 
  batches, 
  onSubmit, 
  onSubmitMultiple,
  isSubmitting, 
  defaultValues,
  supportMultiple = false
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
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;

  // For multiple sessions
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [showSessionForm, setShowSessionForm] = useState<boolean>(false);

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

  const sessionForm = useForm({
    defaultValues: {
      topic: '',
      startTime: '09:00',
      endTime: '10:00',
      meetingLink: '',
      scheduleDate: format(new Date(), 'yyyy-MM-dd'),
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
            sessionForm.setValue('scheduleDate', format(startDate, 'yyyy-MM-dd'));
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
    
    if (supportMultiple && sessions.length > 0) {
      // Submit multiple sessions
      const allSessions = [
        formattedData, 
        ...sessions.map(session => ({
          ...session,
          batchId: parseInt(data.batchId, 10),
          platform: data.platform,
        }))
      ];
      
      if (onSubmitMultiple) {
        onSubmitMultiple(allSessions);
      }
    } else {
      // Submit single session
      onSubmit(formattedData);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      form.setValue('scheduleDate', format(date, 'yyyy-MM-dd'));
      sessionForm.setValue('scheduleDate', format(date, 'yyyy-MM-dd'));
    }
  };

  const isDateDisabled = (date: Date) => {
    if (!minDate || !maxDate) return false;
    
    return date < minDate || date > maxDate;
  };

  const addSession = () => {
    const sessionData = sessionForm.getValues();
    const sessionId = `session-${Date.now()}`;
    
    setSessions([...sessions, { 
      id: sessionId, 
      ...sessionData
    }]);
    
    // Reset form fields except batchId and platform
    sessionForm.reset({
      topic: '',
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      meetingLink: sessionData.meetingLink,
      scheduleDate: sessionData.scheduleDate,
    });
    
    setShowSessionForm(false);
  };

  const removeSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      // If it's already in HH:mm format
      if (timeString.length === 5 && timeString.includes(':')) {
        return timeString;
      }
      // If it's a full date string
      const date = new Date(timeString);
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  return (
    <div className="space-y-6">
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Clear sessions when batch changes
                      if (supportMultiple) {
                        setSessions([]);
                      }
                    }}
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

            {isAdmin && selectedBatch?.instructor && (
              <FormItem>
                <FormLabel>Instructor</FormLabel>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                  <span className="text-sm font-medium">{selectedBatch.instructor.fullName}</span>
                </div>
              </FormItem>
            )}

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

          {supportMultiple && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Additional Sessions</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSessionForm(true)}
                  disabled={!form.watch('batchId')}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Session
                </Button>
              </div>
              
              {sessions.length > 0 && (
                <ScrollArea className="h-[200px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {sessions.map((session) => (
                      <Card key={session.id} className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeSession(session.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Topic:</span> {session.topic}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date:</span> {format(new Date(session.scheduleDate), 'MMM d, yyyy')}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Time:</span> {formatTime(session.startTime)} - {formatTime(session.endTime)}
                            </div>
                            <div className="truncate">
                              <span className="text-muted-foreground">Link:</span> {session.meetingLink}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
              
              {showSessionForm && (
                <Card className="p-4">
                  <h4 className="font-medium mb-4">New Session</h4>
                  <Form {...sessionForm}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={sessionForm.control}
                        name="topic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter topic" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={sessionForm.control}
                        name="scheduleDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="w-full pl-3 text-left font-normal"
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
                                  selected={new Date(field.value)}
                                  onSelect={(date) => {
                                    if (date) {
                                      sessionForm.setValue('scheduleDate', format(date, 'yyyy-MM-dd'));
                                    }
                                  }}
                                  disabled={isDateDisabled}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={sessionForm.control}
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
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={sessionForm.control}
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
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={sessionForm.control}
                        name="meetingLink"
                        render={({ field }) => (
                          <FormItem className="col-span-1 md:col-span-2">
                            <FormLabel>Meeting Link</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end mt-4 space-x-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowSessionForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        onClick={addSession}
                      >
                        Add to List
                      </Button>
                    </div>
                  </Form>
                </Card>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : defaultValues?.scheduleId ? 'Update Schedule' : supportMultiple ? 'Create All Sessions' : 'Create Schedule'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ScheduleForm;
