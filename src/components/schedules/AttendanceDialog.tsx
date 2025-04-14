
import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, UserCheck, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Schedule, Status, Role } from '@/lib/types';
import { useAttendance } from '@/hooks/use-attendance';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  userRole: Role;
  userId: number;
}

const AttendanceDialog = ({ open, onOpenChange, schedule, userRole, userId }: AttendanceDialogProps) => {
  const { 
    useScheduleAttendance, 
    useMarkAttendanceMutation, 
    useMarkBulkAttendanceMutation,
    useUpdateAttendanceMutation
  } = useAttendance();
  
  const [selectedTab, setSelectedTab] = useState('attendance');
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<Status>(Status.present);
  
  const { data: attendanceData, isLoading } = useScheduleAttendance(schedule?.scheduleId || null);
  const attendanceRecords = attendanceData?.data || [];
  
  const markAttendanceMutation = useMarkAttendanceMutation();
  const updateAttendanceMutation = useUpdateAttendanceMutation();
  const markBulkAttendanceMutation = useMarkBulkAttendanceMutation();
  
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
  
  const handleMarkAttendance = (studentId: number, status: Status) => {
    if (!schedule) return;
    
    const existingRecord = attendanceRecords.find(record => record.userId === studentId);
    
    if (existingRecord?.attendanceId) {
      updateAttendanceMutation.mutate({
        attendanceId: existingRecord.attendanceId,
        status,
        scheduleId: schedule.scheduleId
      });
    } else {
      markAttendanceMutation.mutate({
        scheduleId: schedule.scheduleId,
        userId: studentId,
        status
      });
    }
  };
  
  const handleBulkMarkAttendance = () => {
    if (!schedule || selectedStudents.size === 0) return;
    
    const attendanceRecordsToUpdate = Array.from(selectedStudents).map(studentId => ({
      userId: studentId,
      status: bulkStatus
    }));
    
    markBulkAttendanceMutation.mutate({
      scheduleId: schedule.scheduleId,
      attendanceRecords: attendanceRecordsToUpdate
    });
    
    // Clear selections after marking
    setSelectedStudents(new Set());
    setSelectAll(false);
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const newSelectedStudents = new Set<number>();
      attendanceRecords.forEach(record => {
        // Don't include instructors in bulk selection
        if (!record.isInstructor) {
          newSelectedStudents.add(record.userId);
        }
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
    
    // Update selectAll state
    setSelectAll(
      newSelectedStudents.size === attendanceRecords.filter(r => !r.isInstructor).length && 
      newSelectedStudents.size > 0
    );
  };
  
  const getStatusBadge = (status: Status | null) => {
    if (!status) return <Badge variant="outline">Not marked</Badge>;
    
    switch (status) {
      case Status.present:
        return (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <Badge variant="success" className="bg-green-500">Present</Badge>
          </div>
        );
      case Status.absent:
        return (
          <div className="flex items-center gap-1">
            <XCircle className="h-4 w-4 text-red-500" />
            <Badge variant="destructive">Absent</Badge>
          </div>
        );
      case Status.late:
        return (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-yellow-500" />
            <Badge variant="warning" className="bg-yellow-500">Late</Badge>
          </div>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getAttendanceStats = () => {
    const total = attendanceRecords.filter(r => !r.isInstructor).length;
    const present = attendanceRecords.filter(r => !r.isInstructor && r.status === Status.present).length;
    const absent = attendanceRecords.filter(r => !r.isInstructor && r.status === Status.absent).length;
    const late = attendanceRecords.filter(r => !r.isInstructor && r.status === Status.late).length;
    const notMarked = attendanceRecords.filter(r => !r.isInstructor && !r.status).length;
    
    return { total, present, absent, late, notMarked };
  };
  
  const stats = getAttendanceStats();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Attendance Manager</DialogTitle>
        </DialogHeader>
        
        {!schedule ? (
          <div className="text-center p-6">No schedule selected</div>
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
                {(userRole === Role.admin || userRole === Role.instructor) && (
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-md">
                    <div className="font-medium">Bulk Actions:</div>
                    <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as Status)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Status.present}>Present</SelectItem>
                        <SelectItem value={Status.absent}>Absent</SelectItem>
                        <SelectItem value={Status.late}>Late</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleBulkMarkAttendance} 
                      disabled={selectedStudents.size === 0 || markBulkAttendanceMutation.isPending}
                      size="sm"
                    >
                      Mark Selected ({selectedStudents.size})
                    </Button>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="text-center p-6">Loading attendance records...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(userRole === Role.admin || userRole === Role.instructor) && (
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectAll} 
                              onCheckedChange={handleSelectAll}
                              disabled={attendanceRecords.length === 0}
                            />
                          </TableHead>
                        )}
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Marked By</TableHead>
                        {(userRole === Role.admin || userRole === Role.instructor) && (
                          <TableHead>Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.length > 0 ? (
                        attendanceRecords.map((record) => (
                          <TableRow key={record.userId} className={record.isInstructor ? "bg-muted/30" : ""}>
                            {(userRole === Role.admin || userRole === Role.instructor) && (
                              <TableCell>
                                {!record.isInstructor && (
                                  <Checkbox 
                                    checked={selectedStudents.has(record.userId)}
                                    onCheckedChange={(checked) => 
                                      handleSelectStudent(record.userId, checked === true)
                                    }
                                  />
                                )}
                              </TableCell>
                            )}
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {record.isInstructor && <UserCheck className="h-4 w-4 text-primary" />}
                                {record.user.fullName}
                                {record.isInstructor && <Badge variant="outline">Instructor</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell>{record.markedByUser?.fullName || '-'}</TableCell>
                            {(userRole === Role.admin || userRole === Role.instructor) && (
                              <TableCell>
                                {!record.isInstructor && (
                                  <div className="flex gap-2">
                                    <Select
                                      value={record.status || ''}
                                      onValueChange={(value) => {
                                        handleMarkAttendance(record.userId, value as Status);
                                      }}
                                    >
                                      <SelectTrigger className="w-28">
                                        <SelectValue placeholder="Mark" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value={Status.present}>Present</SelectItem>
                                        <SelectItem value={Status.absent}>Absent</SelectItem>
                                        <SelectItem value={Status.late}>Late</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={userRole === Role.student ? 3 : 5} className="text-center py-8">
                            No students found in this batch
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              
              <TabsContent value="summary">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Attendance Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Students:</span>
                          <span className="font-medium">{stats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Present:</span>
                          <span className="font-medium text-green-600">{stats.present}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Absent:</span>
                          <span className="font-medium text-red-600">{stats.absent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Late:</span>
                          <span className="font-medium text-yellow-600">{stats.late}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Not Marked:</span>
                          <span className="font-medium text-gray-600">{stats.notMarked}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2">
                          <span>Attendance Rate:</span>
                          <span className="font-medium">
                            {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative pt-1">
                        <div className="flex h-4 overflow-hidden text-xs rounded-full">
                          {stats.total > 0 && (
                            <>
                              {stats.present > 0 && (
                                <div 
                                  style={{ width: `${(stats.present / stats.total) * 100}%` }}
                                  className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                                ></div>
                              )}
                              {stats.late > 0 && (
                                <div 
                                  style={{ width: `${(stats.late / stats.total) * 100}%` }}
                                  className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                                ></div>
                              )}
                              {stats.absent > 0 && (
                                <div 
                                  style={{ width: `${(stats.absent / stats.total) * 100}%` }}
                                  className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                                ></div>
                              )}
                              {stats.notMarked > 0 && (
                                <div 
                                  style={{ width: `${(stats.notMarked / stats.total) * 100}%` }}
                                  className="flex flex-col text-center whitespace-nowrap text-gray-700 justify-center bg-gray-200"
                                ></div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                            <span>Present</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                            <span>Late</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                            <span>Absent</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-200 rounded-full mr-1"></div>
                            <span>Not Marked</span>
                          </div>
                        </div>
                      </div>
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
