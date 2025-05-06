import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, RefreshCw, Calendar, Clock, Users, Video, UserCheck } from 'lucide-react';
import { getBatches } from '@/lib/api/batches';
import { getAllSchedules, createSchedule, updateSchedule, deleteSchedule } from '@/lib/api/schedules';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Schedule, Batch, Role } from '@/lib/types';
import ScheduleForm from '@/components/schedules/ScheduleForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import AttendanceDialog from '@/components/schedules/AttendanceDialog';
import AttendanceAnalytics from '@/components/attendance/AttendanceAnalytics';
import { apiFetch } from '@/lib/api/core';

const Schedules = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  const isInstructor = user?.role === Role.instructor;
  const isStudent = user?.role === Role.student;

  const { data: batchesData, isLoading: isLoadingBatches } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const response = await getBatches();
      if (!response.success) throw new Error(response.error || 'Failed to fetch batches');
      return response.data || [];
    },
  });

  const { data: schedulesData, isLoading: isLoadingSchedules, error: schedulesError, refetch } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const response = await getAllSchedules();
      if (!response.success) throw new Error(response.error || 'Failed to fetch schedules');
      return response.data || [];
    },
  });

  const filteredBatches = useMemo(() => {
    if (isAdmin) return batchesData || [];
    if (!isInstructor || !user?.userId) return [];
    return (batchesData || []).filter((batch: any) => batch.instructor?.userId === user.userId);
  }, [batchesData, isAdmin, isInstructor, user?.userId]);

  const filteredSchedules = useMemo(() => {
    if (!schedulesData) return [];
    let schedules = schedulesData;

    if (isInstructor && !isAdmin) {
      schedules = schedules.filter((schedule: Schedule) => 
        filteredBatches.some(batch => batch.batchId === schedule.batchId)
      );
    }

    if (selectedBatch) {
      schedules = schedules.filter((schedule: Schedule) => schedule.batchId === selectedBatch);
    }

    return schedules;
  }, [schedulesData, filteredBatches, selectedBatch, isAdmin, isInstructor]);

  const createMutation = useMutation({
    mutationFn: (newSchedule: any) => createSchedule(newSchedule),
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateSchedule(id, data),
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

  const handleAddSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: any) => {
    if (selectedSchedule) {
      updateMutation.mutate({ 
        id: selectedSchedule.scheduleId, 
        data: {
          ...data,
          batchId: parseInt(data.batchId),
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedSchedule) {
      deleteMutation.mutate(selectedSchedule.scheduleId);
    }
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
    try {
      if (timeString.includes('T')) {
        return format(new Date(timeString), 'h:mm a');
      }
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return format(date, 'h:mm a');
    } catch (error) {
      return timeString;
    }
  };

  const now = new Date();

  const upcomingSchedules = useMemo(() => {
    return filteredSchedules
      .filter((schedule: Schedule) => {
        const scheduleDate = new Date(schedule.scheduleDate);
        const scheduleDateTime = new Date(scheduleDate);
        
        // Parse time parts from startTime
        if (schedule.startTime.includes('T')) {
          const startTime = new Date(schedule.startTime);
          scheduleDateTime.setHours(startTime.getHours(), startTime.getMinutes());
        } else {
          const [hours, minutes] = schedule.startTime.split(':').map(Number);
          scheduleDateTime.setHours(hours, minutes);
        }
        
        return scheduleDateTime > new Date();
      })
      .sort((a: Schedule, b: Schedule) => {
        const dateA = new Date(a.scheduleDate);
        const dateB = new Date(b.scheduleDate);
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredSchedules]);

  const pastSchedules = useMemo(() => {
    return filteredSchedules
      .filter((schedule: Schedule) => {
        const scheduleDate = new Date(schedule.scheduleDate);
        const scheduleDateTime = new Date(scheduleDate);
        
        // Parse time parts from startTime
        if (schedule.startTime.includes('T')) {
          const startTime = new Date(schedule.startTime);
          scheduleDateTime.setHours(startTime.getHours(), startTime.getMinutes());
        } else {
          const [hours, minutes] = schedule.startTime.split(':').map(Number);
          scheduleDateTime.setHours(hours, minutes);
        }
        
        return scheduleDateTime <= new Date();
      })
      .sort((a: Schedule, b: Schedule) => {
        const dateA = new Date(a.scheduleDate);
        const dateB = new Date(b.scheduleDate);
        return dateB.getTime() - dateA.getTime();
      });
  }, [filteredSchedules]);

  const ScheduleCard = ({ schedule, isPast = false }: { schedule: Schedule; isPast?: boolean }) => {
    const { data: attendanceStatus } = useQuery({
      queryKey: ['attendanceStatus', schedule.scheduleId],
      queryFn: async () => {
        const response = await apiFetch<{ records: any[] }>(`/attendance/schedule/${schedule.scheduleId}`);
        if (!response.success) return 'not_marked';
        return response.data?.records?.length > 0 ? 'marked' : 'not_marked';
      }
    });

    return (
      <Card className="mb-2 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3 pt-2 px-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base">{schedule.topic}</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {schedule.batch?.instructor?.fullName || 'No instructor assigned'}
              </p>
            </div>
            <div className="flex gap-2">
              {(isAdmin || isInstructor) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setShowAttendanceDialog(true);
                    }}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Mark Attendance
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              {isStudent && isPast && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-blue-600 border-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    setSelectedSchedule(schedule);
                    setShowAttendanceDialog(true);
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  View Attendance
                </Button>
              )}
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
              <span>{schedule.batch?.batchName || 'No batch assigned'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-gray-500" />
              {attendanceStatus === 'marked' ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Attendance Marked
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Attendance Not Marked
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoadingSchedules || isLoadingBatches) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <div className="text-sm text-muted-foreground">Loading schedules...</div>
        </div>
      </div>
    );
  }

  if (schedulesError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading schedules: {schedulesError instanceof Error ? schedulesError.message : 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[{ label: 'Home', link: '/' }, { label: 'Schedules', link: '/schedules' }]} />
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Schedules</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {(isAdmin || isInstructor) && (
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Schedule
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={selectedBatch?.toString() || 'all'}
          onValueChange={(value) => setSelectedBatch(value === 'all' ? null : parseInt(value))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {filteredBatches.map((batch: Batch) => (
              <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                {batch.batchName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          {(isAdmin || isInstructor) && (
            <TabsTrigger value="attendance">Attendance Analytics</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingSchedules.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming schedules found
              </CardContent>
            </Card>
          ) : (
            upcomingSchedules.map((schedule: Schedule) => (
              <ScheduleCard key={schedule.scheduleId} schedule={schedule} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastSchedules.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No past schedules found
              </CardContent>
            </Card>
          ) : (
            pastSchedules.map((schedule: Schedule) => (
              <ScheduleCard key={schedule.scheduleId} schedule={schedule} isPast />
            ))
          )}
        </TabsContent>

        {(isAdmin || isInstructor) && (
          <TabsContent value="attendance" className="space-y-4">
            {selectedBatch ? (
              <AttendanceAnalytics batchId={selectedBatch} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Please select a batch to view attendance analytics
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Schedule</DialogTitle>
          </DialogHeader>
          <ScheduleForm
            batches={filteredBatches}
            onSubmit={handleAddSubmit}
            isSubmitting={createMutation.isPending}
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
              batches={filteredBatches}
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
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AttendanceDialog
        open={showAttendanceDialog}
        onOpenChange={setShowAttendanceDialog}
        schedule={selectedSchedule}
      />
    </div>
  );
};

export default Schedules;
