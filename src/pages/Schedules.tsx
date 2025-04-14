
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { Plus, Edit, Trash2, RefreshCw, Calendar, Clock, Users, Video, ChevronDown, CheckCircle2, XCircle, Clock4, UserCheck, AlertCircle, BookOpen, CalendarClock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBatches } from '@/lib/api/batches';
import { getAllSchedules, createSchedule, updateSchedule, deleteSchedule, ScheduleInput } from '@/lib/api/schedules';
import { useAttendance } from '@/hooks/use-attendance';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Schedule, Batch, Role, Status } from '@/lib/types';
import ScheduleForm from '@/components/schedules/ScheduleForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { GraduationCap, User, Pencil } from 'lucide-react';
import AttendanceDialog from '@/components/schedules/AttendanceDialog';
import AttendanceAnalytics from '@/components/attendance/AttendanceAnalytics';

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
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  const isInstructor = user?.role === Role.instructor;
  const isStudent = user?.role === Role.student;
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  
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

  // Filter batches based on user role
  const filteredBatches = useMemo(() => {
    if (isAdmin) return batchesData || [];
    if (!isInstructor || !user?.userId) return [];
    return (batchesData || []).filter((batch: any) => batch.instructor?.userId === user.userId);
  }, [batchesData, isAdmin, isInstructor, user?.userId]);

  // Filter schedules based on user role
  const filteredSchedules = useMemo(() => {
    if (isAdmin) return schedulesData || [];
    if (!isInstructor || !user?.userId) return [];
    return (schedulesData || []).filter((schedule: any) => 
      filteredBatches.some((batch: any) => batch.batchId === schedule.batchId)
    );
  }, [schedulesData, filteredBatches, isAdmin, isInstructor]);

  // Helper function to check if user can access a schedule
  const canAccessSchedule = (schedule: any) => {
    if (isAdmin) return true;
    if (!isInstructor || !user?.userId) return false;
    return filteredBatches.some((batch: any) => batch.batchId === schedule.batchId);
  };

  // Helper function to render batch link based on access
  const renderBatchLink = (schedule: any) => {
    const batch = filteredBatches.find((b: any) => b.batchId === schedule.batchId);
    if (!batch) return <span>{schedule.batchName}</span>;
    
    if (isAdmin || canAccessSchedule(schedule)) {
      return (
        <Link to={`/batches/${batch.batchId}`} className="text-primary hover:underline">
          {batch.batchName}
        </Link>
      );
    }
    return <span>{batch.batchName}</span>;
  };

  // Helper function to render instructor link based on access
  const renderInstructorLink = (instructor: any) => {
    if (isAdmin) {
      return (
        <Link to={`/instructors/${instructor.userId}`} className="text-primary hover:underline">
          {instructor.fullName}
        </Link>
      );
    }
    return <span>{instructor.fullName}</span>;
  };

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

  const now = new Date();

  const upcomingSchedules = useMemo(() => {
    return filteredSchedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.scheduleDate);
        const scheduleStartTime = new Date(schedule.startTime);
        
        // Set the schedule's date to the scheduleDate
        scheduleStartTime.setFullYear(scheduleDate.getFullYear());
        scheduleStartTime.setMonth(scheduleDate.getMonth());
        scheduleStartTime.setDate(scheduleDate.getDate());
        
        return scheduleStartTime > now && (!selectedBatch || schedule.batchId === selectedBatch);
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduleDate);
        const timeA = new Date(a.startTime);
        dateA.setHours(timeA.getHours(), timeA.getMinutes());
        
        const dateB = new Date(b.scheduleDate);
        const timeB = new Date(b.startTime);
        dateB.setHours(timeB.getHours(), timeB.getMinutes());
        
        return dateA.getTime() - dateB.getTime();
      });
  }, [filteredSchedules, selectedBatch]);

  const pastSchedules = useMemo(() => {
    return filteredSchedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.scheduleDate);
        const scheduleStartTime = new Date(schedule.startTime);
        
        // Set the schedule's date to the scheduleDate
        scheduleStartTime.setFullYear(scheduleDate.getFullYear());
        scheduleStartTime.setMonth(scheduleDate.getMonth());
        scheduleStartTime.setDate(scheduleDate.getDate());
        
        return scheduleStartTime <= now && (!selectedBatch || schedule.batchId === selectedBatch);
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduleDate);
        const timeA = new Date(a.startTime);
        dateA.setHours(timeA.getHours(), timeA.getMinutes());
        
        const dateB = new Date(b.scheduleDate);
        const timeB = new Date(b.startTime);
        dateB.setHours(timeB.getHours(), timeB.getMinutes());
        
        return dateB.getTime() - dateA.getTime();
      });
  }, [filteredSchedules, selectedBatch]);

  const handleBatchSelect = (batchId: string) => {
    setSelectedBatch(batchId === "all" ? null : parseInt(batchId));
  };

  const openAttendanceDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setShowAttendanceDialog(true);
  };

  const getAttendanceStatusBadge = (schedule: Schedule) => {
    // This is just a placeholder. In a real implementation, you might want to fetch the actual status.
    const scheduleDate = new Date(schedule.scheduleDate);
    const isPast = scheduleDate < now;
    
    if (!isPast) {
      return <Badge variant="outline">Upcoming</Badge>;
    }
    
    // For past schedules, show a placeholder badge. In production, this would be based on actual attendance data.
    return <Badge variant="secondary">Attendance Required</Badge>;
  };

  const ScheduleCard = ({ schedule, isPast = false }: { schedule: Schedule; isPast?: boolean }) => (
    <Card className="mb-2 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 pt-2 px-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{schedule.topic}</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              {schedule.batch?.instructor ? renderInstructorLink(schedule.batch.instructor) : 'No Instructor'}
            </p>
          </div>
          <div className="flex gap-1">
            {(isAdmin || isInstructor) && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => openAttendanceDialog(schedule)}
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
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
              </>
            )}
            {isStudent && isPast && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => openAttendanceDialog(schedule)}
              >
                <UserCheck className="h-4 w-4" />
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
            <span>
              {schedule.batch ? renderBatchLink(schedule) : 'No Batch'}
            </span>
          </div>
          {!isPast && schedule.meetingLink && (
            <div className="flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-gray-500" />
              <a
                href={schedule.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Join Meeting
              </a>
            </div>
          )}
          {isPast && (
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-gray-500" />
              {getAttendanceStatusBadge(schedule)}
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
            {(isAdmin || filteredBatches.length > 0) && (
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="gap-2 transition-all hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                Add Schedule
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Select onValueChange={handleBatchSelect} value={selectedBatch?.toString() || "all"}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {filteredBatches.map((batch) => (
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
            {(isAdmin || isInstructor || isStudent) && (
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
            )}
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
          <TabsContent value="attendance" className="space-y-4">
            {isStudent && user ? (
              <AttendanceAnalytics userId={user.userId} />
            ) : (
              selectedBatch ? (
                <AttendanceAnalytics batchId={selectedBatch} />
              ) : (
                <div className="bg-muted p-6 rounded-lg">
                  <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <CalendarClock className="h-12 w-12 text-muted-foreground" />
                    <h3 className="font-medium text-lg">Attendance Analytics</h3>
                    <p className="text-muted-foreground">
                      {isAdmin 
                        ? "Select a batch to view detailed attendance analytics." 
                        : "View and manage attendance for your classes."}
                    </p>
                    {isAdmin && (
                      <Select onValueChange={handleBatchSelect} value={selectedBatch?.toString() || ""}>
                        <SelectTrigger className="w-[250px] mt-2">
                          <SelectValue placeholder="Select a batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredBatches.map((batch) => (
                            <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                              {batch.batchName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              )
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Mark Attendance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Record attendance for your scheduled classes. Mark students as present, absent, or late.
                  </p>
                  <div className="text-sm">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Click on any past schedule to access attendance marking</li>
                      <li>Use bulk actions for faster attendance marking</li>
                      <li>View attendance summary for each class</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <span>Monitor Participation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track student participation and identify attendance patterns across batches and courses.
                  </p>
                  <div className="text-sm">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>View attendance analytics by batch or student</li>
                      <li>Identify students who need attention</li>
                      <li>Generate attendance reports</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <span>Attendance Policy</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Students must maintain at least 75% attendance in all courses to receive certification.
                  </p>
                  <div className="text-sm">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Automatic warnings for low attendance</li>
                      <li>Real-time attendance tracking</li>
                      <li>Attendance affects final grading</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No schedules found
              </div>
            ) : (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Recent Schedules</CardTitle>
                  <CardDescription>Mark or view attendance for recent sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pastSchedules.slice(0, 5).map((schedule) => (
                      <div 
                        key={schedule.scheduleId} 
                        className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() => openAttendanceDialog(schedule)}
                      >
                        <div>
                          <div className="font-medium">{schedule.topic}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(schedule.scheduleDate), 'PPP')}
                            <span className="text-xs">•</span>
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          {isStudent ? "View Attendance" : "Manage Attendance"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
                {pastSchedules.length > 5 && (
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => document.querySelector('[data-value="past"]')?.click()}>
                      View All Past Schedules
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Add New Schedule</DialogTitle>
            </DialogHeader>
            <ScheduleForm
              batches={filteredBatches as Batch[]}
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
                batches={filteredBatches as Batch[]}
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

        <AttendanceDialog 
          open={showAttendanceDialog} 
          onOpenChange={setShowAttendanceDialog}
          schedule={selectedSchedule}
          userRole={user?.role || Role.student}
          userId={user?.userId || 0}
        />
      </div>
    </div>
  );
};

export default Schedules;
