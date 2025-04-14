import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Schedule, Status, Role } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBatchStudents } from '@/lib/api/batches';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api/core';

interface AttendanceRecord {
  attendanceId: number;
  userId: number;
  status: Status;
  markedAt: string;
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
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<Status>(Status.present);
  
  // Fetch batch students
  const { data: batchStudents = [] } = useQuery({
    queryKey: ['batchStudents', schedule?.batchId],
    queryFn: async () => {
      if (!schedule?.batchId) return [];
      const response = await getBatchStudents(schedule.batchId);
      if (!response.success) throw new Error(response.error || 'Failed to fetch students');
      return response.data || [];
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
      return response.data?.records || [];
    },
    enabled: !!schedule?.scheduleId
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: Status }) => {
      if (!schedule?.scheduleId) throw new Error('No schedule selected');
      return apiFetch(`/attendance/mark`, {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: schedule.scheduleId,
          userId,
          status
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', schedule?.scheduleId] });
    }
  });

  // Update attendance mutation
  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ attendanceId, status }: { attendanceId: number; status: Status }) => {
      return apiFetch(`/attendance/${attendanceId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', schedule?.scheduleId] });
    }
  });

  // Bulk mark attendance mutation
  const markBulkAttendanceMutation = useMutation({
    mutationFn: async ({ attendanceRecords }: { attendanceRecords: Array<{ userId: number; status: Status }> }) => {
      if (!schedule?.scheduleId) throw new Error('No schedule selected');
      return apiFetch(`/attendance/bulk`, {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: schedule.scheduleId,
          attendanceRecords
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', schedule?.scheduleId] });
    }
  });

  // Reset selected students when schedule changes
  useEffect(() => {
    setSelectedStudents(new Set());
    setSelectAll(false);
  }, [schedule?.scheduleId]);

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    if (timeString.length <= 8) {
      return timeString.substring(0, 5);
    }
    return format(new Date(timeString), 'hh:mm a');
  };

  const handleMarkAttendance = async (studentId: number, status: Status) => {
    if (!schedule) return;
    
    const existingRecord = attendanceRecords.find(record => record.userId === studentId);
    
    try {
      if (existingRecord?.attendanceId) {
        await updateAttendanceMutation.mutateAsync({
          attendanceId: existingRecord.attendanceId,
          status
        });
      } else {
        await markAttendanceMutation.mutateAsync({
          userId: studentId,
          status
        });
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const handleBulkMarkAttendance = async () => {
    if (!schedule || selectedStudents.size === 0) return;
    
    const attendanceRecordsToUpdate = Array.from(selectedStudents).map(studentId => ({
      userId: studentId,
      status: bulkStatus
    }));
    
    try {
      await markBulkAttendanceMutation.mutateAsync({
        attendanceRecords: attendanceRecordsToUpdate
      });
      
      setSelectedStudents(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Error marking bulk attendance:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const newSelectedStudents = new Set<number>();
      batchStudents.forEach(student => {
        newSelectedStudents.add(student.userId);
      });
      setSelectedStudents(newSelectedStudents);
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    const newSelectedStudents = new Set(selectedStudents);
    if (checked) {
      newSelectedStudents.add(studentId);
    } else {
      newSelectedStudents.delete(studentId);
    }
    setSelectedStudents(newSelectedStudents);
    
    setSelectAll(newSelectedStudents.size === batchStudents.length && newSelectedStudents.size > 0);
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
    const total = batchStudents.length;
    const present = attendanceRecords.filter(r => r.status === Status.present).length;
    const absent = attendanceRecords.filter(r => r.status === Status.absent).length;
    const late = attendanceRecords.filter(r => r.status === Status.late).length;
    const notMarked = total - (present + absent + late);
    
    return { total, present, absent, late, notMarked };
  };

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Attendance Manager</DialogTitle>
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
          <DialogTitle>Attendance Manager</DialogTitle>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-sm">Select All</span>
                    </div>
                    {selectedStudents.size > 0 && (
                      <div className="flex items-center gap-2">
                        <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as Status)}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={Status.present}>Present</SelectItem>
                            <SelectItem value={Status.absent}>Absent</SelectItem>
                            <SelectItem value={Status.late}>Late</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleBulkMarkAttendance}
                          disabled={markBulkAttendanceMutation.isPending}
                        >
                          {markBulkAttendanceMutation.isPending ? 'Marking...' : 'Mark Selected'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      {user?.role !== Role.student && <TableHead className="w-[50px]" />}
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      {user?.role !== Role.student && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchStudents.map((student) => {
                      const attendanceRecord = attendanceRecords.find(record => record.userId === student.userId);
                      return (
                        <TableRow key={student.userId}>
                          {user?.role !== Role.student && (
                            <TableCell>
                              <Checkbox
                                checked={selectedStudents.has(student.userId)}
                                onCheckedChange={(checked) => handleSelectStudent(student.userId, !!checked)}
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{student.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(attendanceRecord?.status || null)}</TableCell>
                          {user?.role !== Role.student && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAttendance(student.userId, Status.present)}
                                  disabled={markAttendanceMutation.isPending}
                                >
                                  Present
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAttendance(student.userId, Status.absent)}
                                  disabled={markAttendanceMutation.isPending}
                                >
                                  Absent
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAttendance(student.userId, Status.late)}
                                  disabled={markAttendanceMutation.isPending}
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
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Present</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{getAttendanceStats().present}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Absent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{getAttendanceStats().absent}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Late</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">{getAttendanceStats().late}</div>
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
