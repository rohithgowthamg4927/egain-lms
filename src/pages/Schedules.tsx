import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { Plus, Edit, Trash2, RefreshCw, Calendar, Clock, Users, Video, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBatches } from '@/lib/api/batches';
import { getAllSchedules, createSchedule, updateSchedule, deleteSchedule, ScheduleInput } from '@/lib/api/schedules';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Schedule, Batch } from '@/lib/types';
import ScheduleForm from '@/components/schedules/ScheduleForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

const Schedules = () => {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: schedulesData, isLoading: isLoadingSchedules, error: schedulesError, refetch } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => getAllSchedules(),
  });

  const { data: batchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  const createMutation = useMutation({
    mutationFn: (newSchedule: ScheduleInput) => createSchedule(newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const createMultipleMutation = useMutation({
    mutationFn: async (schedules: ScheduleInput[]) => {
      const results = [];
      for (const schedule of schedules) {
        const result = await createSchedule(schedule);
        results.push(result);
      }
      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowAddDialog(false);
      toast({
        title: "Success",
        description: `Created ${data.length} schedule sessions successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create schedules: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ScheduleInput> }) => 
      updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowEditDialog(false);
      setSelectedSchedule(null);
      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowDeleteDialog(false);
      setSelectedSchedule(null);
      toast({
        title: "Success",
        description: "Schedule deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const handleAddSubmit = (data: ScheduleInput) => {
    createMutation.mutate(data);
    setShowAddDialog(false);
  };

  const handleAddMultipleSubmit = (data: ScheduleInput[]) => {
    createMultipleMutation.mutate(data);
  };

  const handleEditSubmit = (data: ScheduleInput) => {
    if (selectedSchedule) {
      updateMutation.mutate({ id: selectedSchedule.scheduleId, data });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedSchedule) {
      deleteMutation.mutate(selectedSchedule.scheduleId);
    }
  };

  const openEditDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteDialog(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Schedule list has been refreshed",
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    if (timeString.length <= 8) {
      return timeString.substring(0, 5);
    }
    return format(new Date(timeString), 'hh:mm a');
  };

  const columns = [
    {
      accessorKey: 'scheduleDate' as keyof Schedule,
      header: 'Date',
      cell: ({ row }: { row: { original: Schedule } }) => (
        <span>
          {row.original.scheduleDate ? 
            format(new Date(row.original.scheduleDate), 'PPP') : 
            'Not set'}
        </span>
      ),
    },
    {
      accessorKey: 'batch' as keyof Schedule,
      header: 'Instructor',
      cell: ({ row }: { row: { original: Schedule } }) => (
        <span>{row.original.batch?.instructor?.fullName || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'startTime' as keyof Schedule,
      header: 'Start Time',
      cell: ({ row }: { row: { original: Schedule } }) => (
        <span>{formatTime(row.original.startTime)}</span>
      ),
    },
    {
      accessorKey: 'endTime' as keyof Schedule,
      header: 'End Time',
      cell: ({ row }: { row: { original: Schedule } }) => (
        <span>{formatTime(row.original.endTime)}</span>
      ),
    },
    {
      accessorKey: 'batch' as keyof Schedule,
      header: 'Batch',
      cell: ({ row }: { row: { original: Schedule } }) => (
        <span>{row.original.batch?.batchName || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'meetingLink' as keyof Schedule,
      header: 'Meeting Link',
      cell: ({ row }: { row: { original: Schedule } }) =>
      <a
        href={row.original.meetingLink || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-800 hover:underline"
      >
      {row.original.meetingLink ? 'Join Meeting' : 'No Link'} 
      </a>
    }
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: openEditDialog,
      icon: <Edit className="mr-2 h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: openDeleteDialog,
      icon: <Trash2 className="mr-2 h-4 w-4" />,
    },
  ];

  const schedules = schedulesData?.data || [];
  const batches = batchesData?.data || [];

  const now = new Date();

  const upcomingSchedules = useMemo(() => {
    return schedules
      .filter(schedule => 
        isAfter(parseISO(schedule.scheduleDate), now) &&
        (!selectedBatch || schedule.batchId === selectedBatch)
      )
      .sort((a, b) => parseISO(a.scheduleDate).getTime() - parseISO(b.scheduleDate).getTime());
  }, [schedules, selectedBatch]);

  const pastSchedules = useMemo(() => {
    return schedules
      .filter(schedule => 
        isBefore(parseISO(schedule.scheduleDate), now) &&
        (!selectedBatch || schedule.batchId === selectedBatch)
      )
      .sort((a, b) => parseISO(b.scheduleDate).getTime() - parseISO(a.scheduleDate).getTime());
  }, [schedules, selectedBatch]);

  const handleBatchSelect = (batchId: string) => {
    setSelectedBatch(batchId === "all" ? null : parseInt(batchId));
  };

  const handleInstructorClick = (instructorId: number) => {
    navigate(`/instructors/${instructorId}`);
  };

  const ScheduleCard = ({ schedule, isPast = false }: { schedule: Schedule; isPast?: boolean }) => (
    <Card className="mb-2 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 pt-2 px-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{schedule.topic}</CardTitle>
            <p 
              className="text-xs text-gray-500 mt-0.5 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => schedule.batch?.instructor?.userId && handleInstructorClick(schedule.batch.instructor.userId)}
            >
              {schedule.batch?.instructor?.fullName || 'No Instructor'}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => openEditDialog(schedule)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => openDeleteDialog(schedule)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 px-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-500" />
            <span>{format(new Date(schedule.scheduleDate), 'PPP')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
            <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-500" />
            <span 
              className="cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => schedule.batch?.batchId && navigate(`/batches/${schedule.batch.batchId}`)}
            >
              {schedule.batch?.batchName || 'No Batch'}
            </span>
          </div>
          {!isPast && (
            <div className="flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-gray-500" />
              {schedule.meetingLink ? (
                <a
                  href={schedule.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Join Meeting
                </a>
              ) : (
                <span className="text-gray-500">No Link</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoadingSchedules || isLoadingBatches) {
    return <div className="p-4">Loading schedules...</div>;
  }

  if (schedulesError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>
          Error loading schedules: {schedulesError instanceof Error ? schedulesError.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Schedules', link: '/schedules' }
      ]} />
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Schedules</h1>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline"
              disabled={isRefreshing}
              className="gap-2 transition-all hover:shadow-md"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="gap-2 transition-all hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Add Schedule
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Select onValueChange={handleBatchSelect} value={selectedBatch?.toString() || "all"}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                  {batch.batchName} ({batch.instructor?.fullName || 'No Instructor'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedBatch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedBatch(null)}
              className="text-gray-500"
            >
              Clear Filter
            </Button>
          )}
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming Schedules</TabsTrigger>
            <TabsTrigger value="past">Past Schedules</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No upcoming schedules found
              </div>
            ) : (
              upcomingSchedules.map((schedule) => (
                <ScheduleCard key={schedule.scheduleId} schedule={schedule} />
              ))
            )}
          </TabsContent>
          <TabsContent value="past" className="space-y-4">
            {pastSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No past schedules found
              </div>
            ) : (
              pastSchedules.map((schedule) => (
                <ScheduleCard key={schedule.scheduleId} schedule={schedule} isPast={true} />
              ))
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Add New Schedule</DialogTitle>
            </DialogHeader>
            <ScheduleForm
              batches={batches as Batch[]}
              onSubmit={handleAddSubmit}
              onSubmitMultiple={handleAddMultipleSubmit}
              isSubmitting={createMutation.isPending || createMultipleMutation.isPending}
              supportMultiple={true}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Schedule</DialogTitle>
            </DialogHeader>
            {selectedSchedule && (
              <ScheduleForm
                batches={batches as Batch[]}
                onSubmit={handleEditSubmit}
                isSubmitting={updateMutation.isPending}
                defaultValues={selectedSchedule}
              />
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the schedule
                {selectedSchedule?.topic && ` for "${selectedSchedule.topic}"`}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Schedules;
