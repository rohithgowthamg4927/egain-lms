import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Schedule, Status, Role } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBatchStudents } from '@/lib/api/batches';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api/core';

interface AttendanceRecord {
  attendanceId: number;
  userId: number;
  status: Status;
  markedAt: string;
  role: Role;
  markedBy?: {
    userId: number;
    fullName: string;
    role: Role;
  } | null;
}

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
}

const AttendanceDialog = ({ open, onOpenChange, schedule }: AttendanceDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('attendance');
  
  // Fetch batch students
  const { data: batchStudents = [] } = useQuery({
    queryKey: ['batchStudents', schedule?.batchId],
    queryFn: async () => {
      if (!schedule?.batchId) return [];
      const response = await getBatchStudents(schedule.batchId);
      if (!response.success) throw new Error(response.error || 'Failed to fetch students');
      
      // Add instructor to the list if they exist
      const students = response.data || [];
      if (schedule.batch?.instructor) {
        const instructorData = {
          userId: schedule.batch.instructor.userId,
          fullName: schedule.batch.instructor.fullName,
          email: schedule.batch.instructor.email,
          role: Role.instructor,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        students.push(instructorData);
      }
      
      return students;
    },
    enabled: !!schedule?.batchId
  });

  // Fetch attendance records
  const { data: attendanceRecords = [], isLoading, error } = useQuery({
    queryKey: ['attendance', schedule?.scheduleId],
    queryFn: async () => {
      if (!schedule?.scheduleId) return [];
      const response = await apiFetch<{ records: AttendanceRecord[] }>(`/attendance/schedule/${schedule.scheduleId}`);
      if (!response.success) throw new Error(response.error || 'Failed to fetch attendance records');
      
      // Get all records including instructor
      const records = response.data?.records || [];
      
      // If instructor exists and doesn't have a record, create an absent record
      if (schedule.batch?.instructor) {
        const instructorRecord = records.find(
          record => record.userId === schedule.batch.instructor.userId
        );
        
        if (!instructorRecord) {
          // Create a new record for the instructor as absent
          await apiFetch(`/attendance/mark`, {
            method: 'POST',
            body: JSON.stringify({
              scheduleId: schedule.scheduleId,
              userId: schedule.batch.instructor.userId,
              status: Status.absent
            })
          });
        }
      }
      
      // Refetch the records to get the updated instructor status
      const updatedResponse = await apiFetch<{ records: AttendanceRecord[] }>(`/attendance/schedule/${schedule.scheduleId}`);
      if (!updatedResponse.success) throw new Error(updatedResponse.error || 'Failed to fetch attendance records');
      return updatedResponse.data?.records || [];
    },
    enabled: !!schedule?.scheduleId
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: Status }) => {
      if (!schedule?.scheduleId) throw new Error('No schedule selected');
      const response = await apiFetch(`/attendance/mark`, {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: schedule.scheduleId,
          userId,
          status
        })
      });
      if (!response.success) throw new Error(response.error || 'Failed to mark attendance');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', schedule?.scheduleId] });
    }
  });

  // Add bulk mark attendance mutation
  const markBulkAttendanceMutation = useMutation({
    mutationFn: async ({ status }: { status: Status }) => {
      if (!schedule?.scheduleId) throw new Error('No schedule selected');
      
      // Get all student IDs (excluding instructor)
      const studentIds = batchStudents
        .filter(student => student.role !== Role.instructor)
        .map(student => student.userId);
      
      const response = await apiFetch(`/attendance/bulk`, {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: schedule.scheduleId,
          attendanceRecords: studentIds.map(userId => ({
            userId,
            status
          }))
        })
      });
      
      if (!response.success) throw new Error(response.error || 'Failed to mark bulk attendance');
      
      // If the user is an instructor, mark them as present after bulk marking
      if (user?.role === Role.instructor && schedule.batch?.instructor?.userId === user.userId) {
        await markAttendanceMutation.mutateAsync({
          userId: user.userId,
          status: Status.present
        });
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', schedule?.scheduleId] });
    }
  });

  // Modify clear attendance mutation
  const clearAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!schedule?.scheduleId) throw new Error('No schedule selected');
      
      // Get all attendance records for this schedule
      const records = attendanceRecords || [];
      
      // Delete all attendance records including instructor's
      await Promise.all(
        records.map(record => 
          apiFetch(`/attendance/${record.attendanceId}`, {
            method: 'DELETE'
          })
        )
      );
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', schedule?.scheduleId] });
    }
  });

  const handleMarkAttendance = async (studentId: number, status: Status) => {
    if (!schedule) return;
    
    try {
      // Mark the student's attendance
      await markAttendanceMutation.mutateAsync({
        userId: studentId,
        status
      });

      // If any student's attendance is marked and there's an instructor, mark instructor as present
      if (schedule.batch?.instructor && user?.role === Role.instructor) {
        const instructorId = schedule.batch.instructor.userId;
        await markAttendanceMutation.mutateAsync({
          userId: instructorId,
          status: Status.present
        });
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const handleBulkMarkAttendance = async (status: Status) => {
    try {
      await markBulkAttendanceMutation.mutateAsync({ status });
    } catch (error) {
      console.error('Error marking bulk attendance:', error);
    }
  };

  const handleClearAttendance = async () => {
    try {
      await clearAttendanceMutation.mutateAsync();
    } catch (error) {
      console.error('Error clearing attendance:', error);
    }
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
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  const getStatusBadge = (status: Status | null) => {
    if (!status) return <Badge variant="outline">Not marked</Badge>;
    
    switch (status) {
      case Status.present:
        return (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <Badge variant="outline" className="border-green-600 text-green-600">Present</Badge>
          </div>
        );
      case Status.absent:
        return (
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <Badge variant="outline" className="border-red-600 text-red-600">Absent</Badge>
          </div>
        );
      case Status.late:
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-yellow-600" />
            <Badge variant="outline" className="border-yellow-600 text-yellow-600">Late</Badge>
          </div>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getAttendanceStats = () => {
    // Get only students (excluding instructor)
    const students = batchStudents.filter(student => student.role !== Role.instructor);
    const total = students.length;

    // Filter attendance records to only include student records
    const studentAttendanceRecords = attendanceRecords.filter(record => {
      const student = batchStudents.find(s => s.userId === record.userId);
      return student && student.role !== Role.instructor;
    });

    const present = studentAttendanceRecords.filter(r => r.status === Status.present).length;
    const absent = studentAttendanceRecords.filter(r => r.status === Status.absent).length;
    const late = studentAttendanceRecords.filter(r => r.status === Status.late).length;
    const notMarked = total - (present + absent + late);
    
    return { total, present, absent, late, notMarked };
  };

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Attendance</DialogTitle>
          </DialogHeader>
          <div className="text-center p-6 text-red-600">
            Error loading attendance data. Please try again.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Attendance</DialogTitle>
        </DialogHeader>
        
        {!schedule ? (
          <div className="text-center p-6">No schedule selected</div>
        ) : isLoading ? (
          <div className="text-center p-6">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">Loading attendance data...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <span className="font-semibold">Topic:</span> {schedule.topic}
              </div>
              <div>
                <span className="font-semibold">Date:</span> {format(new Date(schedule.scheduleDate), 'PPP')}
              </div>
              <div>
                <span className="font-semibold">Time:</span> {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
              </div>
              <div>
                <span className="font-semibold">Batch:</span> {schedule.batch?.batchName}
              </div>
            </div>
            
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              
              <TabsContent value="attendance" className="space-y-4">
                {user?.role !== Role.student && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm mr-2">Mark All:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkMarkAttendance(Status.present)}
                        disabled={markBulkAttendanceMutation.isPending || clearAttendanceMutation.isPending}
                      >
                        Present
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkMarkAttendance(Status.absent)}
                        disabled={markBulkAttendanceMutation.isPending || clearAttendanceMutation.isPending}
                      >
                        Absent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkMarkAttendance(Status.late)}
                        disabled={markBulkAttendanceMutation.isPending || clearAttendanceMutation.isPending}
                      >
                        Late
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={handleClearAttendance}
                      disabled={markBulkAttendanceMutation.isPending || clearAttendanceMutation.isPending}
                    >
                      Clear Attendance
                    </Button>
                  </div>
                )}
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      {user?.role !== Role.student && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchStudents.map((student) => {
                      const attendanceRecord = attendanceRecords.find(record => record.userId === student.userId);
                      const isInstructor = student.role === Role.instructor;
                      
                      return (
                        <TableRow key={student.userId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{student.fullName}</span>
                              {isInstructor && (
                                <Badge variant="secondary">Instructor</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(attendanceRecord?.status || null)}
                            </div>
                          </TableCell>
                          {user?.role !== Role.student && !isInstructor && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAttendance(student.userId, Status.present)}
                                  disabled={markAttendanceMutation.isPending || clearAttendanceMutation.isPending}
                                >
                                  Present
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAttendance(student.userId, Status.absent)}
                                  disabled={markAttendanceMutation.isPending || clearAttendanceMutation.isPending}
                                >
                                  Absent
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAttendance(student.userId, Status.late)}
                                  disabled={markAttendanceMutation.isPending || clearAttendanceMutation.isPending}
                                >
                                  Late
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="summary">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{getAttendanceStats().total}</div>
                      <p className="text-xs text-muted-foreground mt-1">Enrolled in batch</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Present</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{getAttendanceStats().present}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((getAttendanceStats().present / getAttendanceStats().total) * 100).toFixed(1)}% of students
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Absent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{getAttendanceStats().absent}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((getAttendanceStats().absent / getAttendanceStats().total) * 100).toFixed(1)}% of students
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Late</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{getAttendanceStats().late}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((getAttendanceStats().late / getAttendanceStats().total) * 100).toFixed(1)}% of students
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDialog;
