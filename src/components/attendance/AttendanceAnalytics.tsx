import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { CalendarClock, Users, Medal, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/core';
import { Status, Role } from '@/lib/types';
import { format } from 'date-fns';
import { formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AttendanceAnalyticsProps {
  userId?: number;
  batchId?: number;
}

interface AttendanceRecord {
  attendanceId: number;
  scheduleId: number;
  userId: number;
  status: Status;
  markedBy: number; 
  createdAt: string;
  updatedAt: string;
  user: {
    userId: number;
    fullName: string;
    email: string;
    role: Role;
  };
  schedule: {
    scheduleId: number;
    topic: string;
    scheduleDate: string;
    startTime: string;
    endTime: string;
    batch: {
      batchId: number;
      batchName: string;
      instructor: {
        userId: number;
        fullName: string;
      };
    };
  };
  markedByUser: {
    userId: number;
    fullName: string;
    role: Role;
  };
}

interface AttendanceAnalytics {
  overall: {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  byBatch?: Array<{
    batchId: number;
    batchName: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
    scheduleDate?: string;
    startTime?: string;
    endTime?: string;
  }>;
  students?: Array<{
    userId: number;
    fullName: string;
    email: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  }>;
  history?: Array<{
    attendanceId: number;
    scheduleId: number;
    userId: number;
    status: Status;
    markedAt: string;
    user: {
      userId: number;  
      fullName: string;
      email: string;
      role: Role;
    };
    schedule: {
      topic: string;
      scheduleDate: string;
      startTime: string;
      endTime: string;
      batch?: {      
        batchName: string;
        instructor?: {
          fullName: string;
        };
      };
    };
    markedByUser: {
      fullName: string;
      email: string;
      role: Role;
    };
  }>;
  totalClasses?: number;
  totalStudents?: number;
}

interface AttendanceHistoryResponse {
  success: boolean;
  data: Array<{
    attendanceId: number;
    scheduleId: number;
    userId: number;
    status: Status;
    markedBy: number;
    createdAt: string;
    updatedAt: string;
    user: {
      userId: number;
      fullName: string;
      email: string;
      role: Role;
    };
    schedule: {
      scheduleId: number;
      topic: string;
      scheduleDate: string;
      startTime: string;
      endTime: string;
      batch: {
        batchId: number;
        batchName: string;
        instructor: {
          userId: number;
          fullName: string;
        };
      };
    };
    markedByUser: {
      userId: number;
      fullName: string;
      role: Role;
    };
  }>;
}

const AttendanceAnalytics = ({ userId, batchId }: AttendanceAnalyticsProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  
  const { data: studentData, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['studentAttendance', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await apiFetch<AttendanceAnalytics>(`/attendance/analytics/student/${userId}`);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!userId
  });

  const { data: batchData, isLoading: isLoadingBatch } = useQuery({
    queryKey: ['batchAttendance', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      
      const analyticsResponse = await apiFetch<{
        overall: {
          total: number;
          present: number;
          absent: number;
          late: number;
          percentage: number;
        };
        students: Array<{
          userId: number;
          fullName: string;
          email: string;
          total: number;
          present: number;
          absent: number;
          late: number;
          percentage: number;
        }>;
        totalClasses: number;
        totalStudents: number;
      }>(`/attendance/analytics/batch/${batchId}`);
      
      if (!analyticsResponse.success) throw new Error(analyticsResponse.error);
      
      const historyResponse = await apiFetch<AttendanceHistoryResponse>(`/attendance/history/${batchId}`);
      
      if (!historyResponse.success) throw new Error(historyResponse.error);
      
      const combinedData = {
        ...analyticsResponse.data,
        history: historyResponse.data
      };
      
      return combinedData;
    },
    enabled: !!batchId
  });
  
  const filteredHistory = useMemo(() => {
    if (!batchData?.history || !Array.isArray(batchData.history)) {
      return [];
    }

    if (user?.role === Role.admin) {
      // For admin, show both student and instructor records
      return batchData.history;
    } else if (user?.role === Role.instructor) {
      // For instructor, show only student records
      return batchData.history.filter(record => record.user.role === Role.student);
    } else if (user?.role === Role.student && user?.userId) {
      // For students, show only their own records
      return batchData.history.filter(record => record.user.userId === user.userId);
    }
    
    return [];
  }, [batchData?.history, user]);
  
  const isLoading = isLoadingStudent || isLoadingBatch;
  const isError = false; 
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            Failed to load attendance analytics.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (userId && studentData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{studentData.overall.percentage}%</div>
              <Progress value={studentData.overall.percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Based on {studentData.overall.total} classes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1">
                <div className="text-3xl font-bold">{studentData.overall.present}</div>
                <div className="text-muted-foreground mb-1">/ {studentData.overall.total}</div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Present: {studentData.overall.present}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Late: {studentData.overall.late}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Absent: {studentData.overall.absent}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Attendance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentData.overall.percentage >= 75 ? (
                  <div className="flex items-center text-green-500">
                    <Medal className="h-5 w-5 mr-1" />
                    Good
                  </div>
                ) : studentData.overall.percentage >= 60 ? (
                  <div className="flex items-center text-yellow-500">
                    <AlertCircle className="h-5 w-5 mr-1" />
                    Warning
                  </div>
                ) : (
                  <div className="flex items-center text-red-500">
                    <XCircle className="h-5 w-5 mr-1" />
                    Critical
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {studentData.overall.percentage >= 75
                  ? "You're doing great! Keep up the good attendance."
                  : studentData.overall.percentage >= 60
                  ? "Your attendance needs improvement. Try to attend more classes."
                  : "Your attendance is critically low. Please contact your instructor."}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Batch Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentData.byBatch.map((batch) => (
                <div key={batch.batchId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{batch.batchName}</div>
                    <div className="text-sm">
                      {batch.percentage}% ({batch.present}/{batch.total} classes)
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    {batch.scheduleDate && (
                      <div className="flex items-center gap-2">
                        <span>{format(new Date(batch.scheduleDate), 'PPP')}</span>
                        {batch.startTime && batch.endTime && (
                          <span>
                            {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Progress value={batch.percentage} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Present: {batch.present}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-yellow-500" />
                      Late: {batch.late}
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      Absent: {batch.absent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (batchId && batchData) {
    return (
      <div className="w-[1200px] space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="history">Detailed History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{batchData.overall.percentage}%</div>
                  <Progress value={batchData.overall.percentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Batch Average
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Class Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5" />
                    <div className="text-2xl font-bold">{batchData.totalClasses || 0}</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total Classes
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {batchData.totalStudents || 0} students enrolled
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Present</span>
                    </div>
                    <span>{batchData.overall.present} ({Math.round((batchData.overall.present / batchData.overall.total) * 100)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Late</span>
                    </div>
                    <span>{batchData.overall.late} ({Math.round((batchData.overall.late / batchData.overall.total) * 100)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Absent</span>
                    </div>
                    <span>{batchData.overall.absent} ({Math.round((batchData.overall.absent / batchData.overall.total) * 100)}%)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pt-1">
                  <div className="text-sm mb-1">Attendance Distribution</div>
                  <div className="flex h-5 overflow-hidden text-xs rounded-md">
                    <div 
                      style={{ width: `${(batchData.overall.present / batchData.overall.total) * 100}%` }}
                      className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                    ></div>
                    <div 
                      style={{ width: `${(batchData.overall.late / batchData.overall.total) * 100}%` }}
                      className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                    ></div>
                    <div 
                      style={{ width: `${(batchData.overall.absent / batchData.overall.total) * 100}%` }}
                      className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {batchData.students && batchData.students.map((student) => (
                    <div key={student.userId} className="space-y-1">
                      <div className="flex justify-between items-center gap-4">
                        <div className="font-medium min-w-[200px]">{student.fullName}</div>
                        <div className="flex-1 max-w-[400px]">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">
                              <span className="font-semibold">{student.percentage}%</span> 
                              ({student.present}/{student.total} classes)
                            </span>
                          </div>
                          <Progress value={student.percentage} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            ) : filteredHistory.length === 0 ? (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center text-muted-foreground">
                    No attendance records found.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((record) => (
                  <Card key={record.attendanceId}>
                    <CardContent className="py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{record.user.fullName}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {record.status === Status.present && (
                              <div className="flex items-center gap-1 text-green-500">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Present</span>
                              </div>
                            )}
                            {record.status === Status.absent && (
                              <div className="flex items-center gap-1 text-red-500">
                                <XCircle className="h-4 w-4" />
                                <span>Absent</span>
                              </div>
                            )}
                            {record.status === Status.late && (
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Clock className="h-4 w-4" />
                                <span>Late</span>
                              </div>
                            )}
                            {record.user.role === Role.instructor && (
                              <Badge variant="secondary">Instructor</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm">
                          <div className="text-muted-foreground">Date & time - {format(new Date(record.schedule.scheduleDate), 'PPP')} • {formatTime(record.schedule.startTime)} - {formatTime(record.schedule.endTime)}
                          </div>
                          {record.schedule.batch && record.user.role === Role.student && (
                            <div className="text-muted-foreground mt-1">
                              Batch: {record.schedule.batch.batchName}
                              {record.schedule.batch.instructor && (
                                <span> • Instructor: {record.schedule.batch.instructor.fullName}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  return (
    <Card>
      <CardContent className="py-6">
        <div className="text-center text-muted-foreground">
          Select a student or batch to view attendance analytics.
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceAnalytics;
