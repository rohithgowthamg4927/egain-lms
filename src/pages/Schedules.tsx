import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query to fetch schedules
  const { data: schedulesData, isLoading: isLoadingSchedules, error: schedulesError } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => getAllSchedules(),
  });
  
  // Query to fetch batches for the form
  const { data: batchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['batches'],
    queryFn: getBatches,
  });

  // Mutation to create a new schedule
  const createMutation = useMutation({
    mutationFn: (newSchedule: ScheduleInput) => createSchedule(newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setShowAddDialog(false);
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

  // Mutation to update a schedule
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

  // Mutation to delete a schedule
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

  // Handle add schedule
  const handleAddSubmit = (data: ScheduleInput) => {
    createMutation.mutate(data);
  };

  // Handle edit schedule
  const handleEditSubmit = (data: ScheduleInput) => {
    if (selectedSchedule) {
      updateMutation.mutate({ id: selectedSchedule.scheduleId, data });
    }
  };

  // Handle delete schedule
  const handleDeleteConfirm = () => {
    if (selectedSchedule) {
      deleteMutation.mutate(selectedSchedule.scheduleId);
    }
  };

  // Open edit dialog
  const openEditDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowEditDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowDeleteDialog(true);
  };

  // Format time string for display
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    // If timeString is just a time (HH:MM:SS), convert to a display format
    if (timeString.length <= 8) {
      return timeString.substring(0, 5); // Just take HH:MM
    }
    // Otherwise assume it's a full ISO date string
    return format(new Date(timeString), 'HH:mm');
  };

  // Table columns definition
  const columns = [
    {
      accessorKey: 'topic',
      header: 'Topic',
    },
    {
      accessorKey: 'scheduleDate',
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
      accessorKey: 'startTime',
      header: 'Start Time',
      cell: ({ row }: { row: { original: Schedule } }) => (
        <span>{formatTime(row.original.startTime)}</span>
      ),
    },
    {
      accessorKey: 'endTime',
      header: 'End Time',
      cell: ({ row }: { row: { original: Schedule } }) => (
        <span>{formatTime(row.original.endTime)}</span>
      ),
    },
    {
      accessorKey: 'batch',
      header: 'Batch',
      cell: ({ row }: { row: { original: Schedule } }) => (
        <span>{row.original.batch?.batchName || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'platform',
      header: 'Platform',
    },
  ];

  // Table actions
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

  // Loading or error states
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
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Schedule
        </Button>
      </div>

      <DataTable
        data={schedules}
        columns={columns}
        actions={actions}
        pagination
      />

      {/* Add Schedule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Schedule</DialogTitle>
          </DialogHeader>
          <ScheduleForm
            batches={batches as Batch[]}
            onSubmit={handleAddSubmit}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
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

      {/* Delete Confirmation Dialog */}
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
