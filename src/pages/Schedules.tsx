import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { getSchedules, getBatches, createSchedule, deleteSchedule } from '@/lib/api';
import { Schedule, Batch } from '@/lib/types';
import { Plus, Search, Calendar, Clock, Video, Edit, Trash, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatTime, formatTimeRange } from '@/lib/utils/date-helpers';

// Days of the week for display
const daysOfWeek = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const Schedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form states for creating a new schedule
  const [newScheduleBatchId, setNewScheduleBatchId] = useState('');
  const [newScheduleDayOfWeek, setNewScheduleDayOfWeek] = useState('1');
  const [newScheduleStartTime, setNewScheduleStartTime] = useState('');
  const [newScheduleEndTime, setNewScheduleEndTime] = useState('');
  const [newScheduleTopic, setNewScheduleTopic] = useState('');
  const [newSchedulePlatform, setNewSchedulePlatform] = useState('zoom');
  const [newScheduleMeetingLink, setNewScheduleMeetingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      const [schedulesResponse, batchesResponse] = await Promise.all([
        getSchedules(),
        getBatches(),
      ]);
      
      if (schedulesResponse.success && schedulesResponse.data) {
        setSchedules(schedulesResponse.data);
      } else {
        toast({
          title: 'Error',
          description: schedulesResponse.error || 'Failed to fetch schedules',
          variant: 'destructive',
        });
      }
      
      if (batchesResponse.success && batchesResponse.data) {
        setBatches(batchesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [toast]);

  const filteredSchedules = schedules.filter((schedule) => {
    // If there's a search term, filter by topic
    const matchesSearch = !searchTerm || 
      (schedule.topic && schedule.topic.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // If a batch is selected, filter by batchId
    const matchesBatch = selectedBatch === 'all' || 
      schedule.batchId.toString() === selectedBatch;
    
    return matchesSearch && matchesBatch;
  });

  const handleCreateSchedule = async () => {
    if (!newScheduleBatchId || !newScheduleStartTime || !newScheduleEndTime || !newScheduleTopic) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const scheduleData = {
        batchId: parseInt(newScheduleBatchId),
        dayOfWeek: parseInt(newScheduleDayOfWeek),
        startTime: newScheduleStartTime,
        endTime: newScheduleEndTime,
        topic: newScheduleTopic,
        platform: newSchedulePlatform,
        meetingLink: newScheduleMeetingLink,
      };

      const response = await createSchedule(scheduleData);

      if (response.success) {
        toast({
          title: 'Schedule created',
          description: 'The schedule has been created successfully',
        });
        
        // Refresh schedules
        fetchData();
        
        // Reset form and close dialog
        setNewScheduleBatchId('');
        setNewScheduleDayOfWeek('1');
        setNewScheduleStartTime('');
        setNewScheduleEndTime('');
        setNewScheduleTopic('');
        setNewSchedulePlatform('zoom');
        setNewScheduleMeetingLink('');
        setIsCreateDialogOpen(false);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleToDelete: Schedule) => {
    try {
      const response = await deleteSchedule(scheduleToDelete.scheduleId);

      if (response.success) {
        toast({
          title: 'Schedule deleted',
          description: 'The schedule has been deleted successfully',
        });
        
        // Refresh schedules
        fetchData();
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

  // Define the columns for the data table with proper typing
  const scheduleColumns = [
    {
      accessorKey: 'batchId' as keyof Schedule,
      header: 'Batch & Course',
      cell: ({ row }: { row: { original: Schedule } }) => {
        const schedule = row.original;
        const batch = batches.find(b => b.batchId === schedule.batchId);
        const batchName = batch?.batchName || 'Unknown Batch';
        const courseName = batch?.course?.courseName || 'Unknown Course';
        
        return (
          <div>
            <p className="font-medium">{batchName}</p>
            <p className="text-sm text-muted-foreground">{courseName}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'dayOfWeek' as keyof Schedule,
      header: 'Day',
      cell: ({ row }: { row: { original: Schedule } }) => {
        const schedule = row.original;
        return daysOfWeek[schedule.dayOfWeek] || 'Unknown';
      },
    },
    {
      accessorKey: 'topic' as keyof Schedule,
      header: 'Topic',
      cell: ({ row }: { row: { original: Schedule } }) => {
        const schedule = row.original;
        return schedule.topic || 'No topic';
      },
    },
    {
      accessorKey: 'startTime' as keyof Schedule,
      header: 'Time',
      cell: ({ row }: { row: { original: Schedule } }) => {
        const schedule = row.original;
        return (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            {formatTimeRange(schedule.startTime, schedule.endTime)}
          </div>
        );
      },
    },
    {
      accessorKey: 'platform' as keyof Schedule,
      header: 'Platform',
      cell: ({ row }: { row: { original: Schedule } }) => {
        const schedule = row.original;
        return (
          <span className="capitalize">{schedule.platform || 'N/A'}</span>
        );
      },
    },
    {
      accessorKey: 'meetingLink' as keyof Schedule,
      header: 'Meeting Link',
      cell: ({ row }: { row: { original: Schedule } }) => {
        const schedule = row.original;
        return (
          schedule.meetingLink ? (
            <a 
              href={schedule.meetingLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:underline"
            >
              <LinkIcon className="h-4 w-4 mr-1" />
              Join Meeting
            </a>
          ) : (
            <span className="text-muted-foreground">No link available</span>
          )
        );
      },
    },
  ];

  const scheduleActions = [
    {
      label: 'Edit',
      onClick: (schedule: Schedule) => {
        toast({
          title: 'Edit Schedule',
          description: `Editing schedule for ${daysOfWeek[schedule.dayOfWeek]}`,
        });
        // Implement edit functionality
      },
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: (schedule: Schedule) => {
        handleDeleteSchedule(schedule);
      },
      icon: <Trash className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Schedules</h1>
          <p className="text-muted-foreground">
            Manage your class schedules and meeting links.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
              <DialogDescription>
                Enter the details for the new class schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="batchId">Batch</Label>
                <Select value={newScheduleBatchId} onValueChange={setNewScheduleBatchId}>
                  <SelectTrigger id="batchId">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                        {batch.batchName} - {batch.course?.courseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={newScheduleTopic}
                  onChange={(e) => setNewScheduleTopic(e.target.value)}
                  placeholder="Enter class topic"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select value={newScheduleDayOfWeek} onValueChange={setNewScheduleDayOfWeek}>
                  <SelectTrigger id="dayOfWeek">
                    <SelectValue placeholder="Select day of week" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newScheduleStartTime}
                    onChange={(e) => setNewScheduleStartTime(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newScheduleEndTime}
                    onChange={(e) => setNewScheduleEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={newSchedulePlatform} onValueChange={setNewSchedulePlatform}>
                  <SelectTrigger id="platform">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="google-meet">Google Meet</SelectItem>
                    <SelectItem value="microsoft-teams">Microsoft Teams</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="meetingLink">Meeting Link</Label>
                <Input
                  id="meetingLink"
                  value={newScheduleMeetingLink}
                  onChange={(e) => setNewScheduleMeetingLink(e.target.value)}
                  placeholder="Enter meeting link"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSchedule}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{schedules.length}</span>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week's Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {schedules.filter(s => s.dayOfWeek >= 0 && s.dayOfWeek <= 6).length}
              </span>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Online Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {schedules.filter(s => s.platform === 'zoom' || s.platform === 'google-meet' || s.platform === 'microsoft-teams').length}
              </span>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Video className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schedules by topic..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Select
              value={selectedBatch}
              onValueChange={setSelectedBatch}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                    {batch.batchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading schedules...</p>
          </div>
        ) : (
          <DataTable
            data={filteredSchedules}
            columns={scheduleColumns}
            actions={scheduleActions}
            className="w-full"
            searchKey="topic"
          />
        )}
      </div>
    </div>
  );
};

export default Schedules;
