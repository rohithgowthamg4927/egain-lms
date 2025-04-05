
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
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

const Schedules = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      accessorKey: 'topic' as keyof Schedule,
      header: 'Topic',
    },
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

  const schedules = schedulesData?.data || [];
  const batches = batchesData?.data || [];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Schedules</h1>
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

      <DataTable
        data={schedules}
        columns={columns}
        actions={actions}
        pagination
      />

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
  );
};

export default Schedules;
