
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBatches } from '@/lib/api';
import { Batch, Schedule } from '@/lib/types';
import { getAllSchedules, createSchedule, updateSchedule, deleteSchedule } from '@/lib/api/schedules';
import { Calendar, Clock, Plus, Search, Trash2, Edit, ExternalLink, Save } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils/date-helpers';

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const Schedules = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New schedule form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  
  // Form fields
  const [formBatchId, setFormBatchId] = useState<string>('');
  const [formDayOfWeek, setFormDayOfWeek] = useState<string>('');
  const [formStartTime, setFormStartTime] = useState<string>('');
  const [formEndTime, setFormEndTime] = useState<string>('');
  const [formTopic, setFormTopic] = useState<string>('');
  const [formPlatform, setFormPlatform] = useState<string>('');
  const [formMeetingLink, setFormMeetingLink] = useState<string>('');
  
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch batches
      const batchesResponse = await getBatches();
      if (batchesResponse.success && batchesResponse.data) {
        setBatches(batchesResponse.data);
      }
      
      // Fetch schedules - filter by batch if needed
      const params = selectedBatchId !== 'all' ? { batchId: selectedBatchId } : {};
      const schedulesResponse = await getAllSchedules(params);
      
      if (schedulesResponse.success && schedulesResponse.data) {
        setSchedules(schedulesResponse.data);
      } else {
        toast({
          title: 'Error',
          description: schedulesResponse.error || 'Failed to fetch schedules',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [selectedBatchId, toast]);
  
  const filteredSchedules = schedules.filter((schedule) => {
    const batchName = schedule.batch?.batchName || '';
    const topic = schedule.topic || '';
    
    return (
      (batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       topic.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedBatchId === 'all' || String(schedule.batchId) === selectedBatchId)
    );
  });
  
  const handleAddScheduleClick = () => {
    // Reset form fields
    setFormBatchId('');
    setFormDayOfWeek('1'); // Default to Monday
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormTopic('');
    setFormPlatform('Zoom');
    setFormMeetingLink('');
    
    setIsAddDialogOpen(true);
  };
  
  const handleEditScheduleClick = (schedule: Schedule) => {
    setCurrentSchedule(schedule);
    
    // Format times correctly
    const startTime = new Date(schedule.startTime).toTimeString().substring(0, 5);
    const endTime = new Date(schedule.endTime).toTimeString().substring(0, 5);
    
    // Populate form fields
    setFormBatchId(String(schedule.batchId));
    setFormDayOfWeek(String(schedule.dayOfWeek));
    setFormStartTime(startTime);
    setFormEndTime(endTime);
    setFormTopic(schedule.topic || '');
    setFormPlatform(schedule.platform || 'Zoom');
    setFormMeetingLink(schedule.meetingLink || '');
    
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteConfirmation = (schedule: Schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    
    try {
      const response = await deleteSchedule(scheduleToDelete.scheduleId);
      
      if (response.success) {
        toast({
          title: 'Schedule deleted',
          description: 'Schedule has been deleted successfully',
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
        description: 'An error occurred while deleting the schedule',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setScheduleToDelete(null);
    }
  };
  
  const handleCreateSchedule = async () => {
    try {
      if (!formBatchId || !formDayOfWeek || !formStartTime || !formEndTime) {
        toast({
          title: 'Missing fields',
          description: 'Please fill all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      const scheduleData = {
        batchId: parseInt(formBatchId),
        dayOfWeek: parseInt(formDayOfWeek),
        startTime: formStartTime,
        endTime: formEndTime,
        topic: formTopic,
        platform: formPlatform,
        meetingLink: formMeetingLink,
      };
      
      const response = await createSchedule(scheduleData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Schedule created successfully',
        });
        
        // Refresh schedules
        fetchData();
        setIsAddDialogOpen(false);
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
        description: 'An error occurred while creating the schedule',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateSchedule = async () => {
    if (!currentSchedule) return;
    
    try {
      if (!formBatchId || !formDayOfWeek || !formStartTime || !formEndTime) {
        toast({
          title: 'Missing fields',
          description: 'Please fill all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      const scheduleData = {
        batchId: parseInt(formBatchId),
        dayOfWeek: parseInt(formDayOfWeek),
        startTime: formStartTime,
        endTime: formEndTime,
        topic: formTopic,
        platform: formPlatform,
        meetingLink: formMeetingLink,
      };
      
      const response = await updateSchedule(currentSchedule.scheduleId, scheduleData);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Schedule updated successfully',
        });
        
        // Refresh schedules
        fetchData();
        setIsEditDialogOpen(false);
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
        description: 'An error occurred while updating the schedule',
        variant: 'destructive',
      });
    }
  };

  const getDayName = (dayIndex: number) => {
    return DAYS_OF_WEEK.find(day => parseInt(day.value) === dayIndex)?.label || 'Unknown';
  };
  
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return timeString;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Schedules</h1>
        <Button onClick={handleAddScheduleClick}>
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{schedules.length}</span>
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Weekly Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {schedules.filter((s, i, arr) => 
                  arr.findIndex(t => 
                    t.batchId === s.batchId && 
                    t.dayOfWeek === s.dayOfWeek
                  ) === i
                ).length}
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search schedules..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Select
              value={selectedBatchId}
              onValueChange={setSelectedBatchId}
            >
              <SelectTrigger className="w-[220px]">
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

      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading schedules...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No schedules found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Meeting Link</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.map((schedule) => (
                <TableRow key={schedule.scheduleId}>
                  <TableCell>
                    <div className="font-medium">
                      {schedule.batch?.batchName || 'Unknown Batch'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {schedule.batch?.course?.courseName || 'Unknown Course'}
                    </div>
                  </TableCell>
                  <TableCell>{getDayName(schedule.dayOfWeek)}</TableCell>
                  <TableCell>
                    {`${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`}
                  </TableCell>
                  <TableCell>{schedule.topic || 'General Session'}</TableCell>
                  <TableCell>{schedule.platform || 'Online'}</TableCell>
                  <TableCell>
                    {schedule.meetingLink ? (
                      <a 
                        href={schedule.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        <span>Join</span>
                      </a>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditScheduleClick(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDeleteConfirmation(schedule)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      
      {/* Add Schedule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Schedule</DialogTitle>
            <DialogDescription>
              Create a new schedule for a batch. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="batch" className="text-right">
                Batch *
              </Label>
              <Select
                value={formBatchId}
                onValueChange={setFormBatchId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                      {batch.batchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dayOfWeek" className="text-right">
                Day *
              </Label>
              <Select
                value={formDayOfWeek}
                onValueChange={setFormDayOfWeek}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time *
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time *
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="topic" className="text-right">
                Topic
              </Label>
              <Input
                id="topic"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                placeholder="e.g., Introduction to React"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="platform" className="text-right">
                Platform
              </Label>
              <Select
                value={formPlatform}
                onValueChange={setFormPlatform}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Zoom">Zoom</SelectItem>
                  <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                  <SelectItem value="Google Meet">Google Meet</SelectItem>
                  <SelectItem value="In Person">In Person</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meetingLink" className="text-right">
                Meeting Link
              </Label>
              <Input
                id="meetingLink"
                value={formMeetingLink}
                onChange={(e) => setFormMeetingLink(e.target.value)}
                placeholder="https://..."
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule}>
              <Save className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update the schedule details. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="batch" className="text-right">
                Batch *
              </Label>
              <Select
                value={formBatchId}
                onValueChange={setFormBatchId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                      {batch.batchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dayOfWeek" className="text-right">
                Day *
              </Label>
              <Select
                value={formDayOfWeek}
                onValueChange={setFormDayOfWeek}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">
                Start Time *
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">
                End Time *
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="topic" className="text-right">
                Topic
              </Label>
              <Input
                id="topic"
                value={formTopic}
                onChange={(e) => setFormTopic(e.target.value)}
                placeholder="e.g., Introduction to React"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="platform" className="text-right">
                Platform
              </Label>
              <Select
                value={formPlatform}
                onValueChange={setFormPlatform}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Zoom">Zoom</SelectItem>
                  <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                  <SelectItem value="Google Meet">Google Meet</SelectItem>
                  <SelectItem value="In Person">In Person</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meetingLink" className="text-right">
                Meeting Link
              </Label>
              <Input
                id="meetingLink"
                value={formMeetingLink}
                onChange={(e) => setFormMeetingLink(e.target.value)}
                placeholder="https://..."
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSchedule}>
              <Save className="h-4 w-4 mr-2" />
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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

export default Schedules;
