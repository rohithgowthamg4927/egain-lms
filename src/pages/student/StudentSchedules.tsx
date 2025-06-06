
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getStudentSchedules, getStudentBatches, getStudentAttendanceHistory } from '@/lib/api/students';
import { getAllSchedules } from '@/lib/api/schedules';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Schedule, Status, Role } from '@/lib/types';
import { format, parseISO, startOfWeek, addDays, isSameDay, addWeeks, isAfter, isBefore, isToday } from 'date-fns';
import { Calendar, Clock, ExternalLink, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Progress } from '@/components/ui/progress';
import { apiFetch } from '@/lib/api/core';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

export default function StudentSchedules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const { data: studentBatchesData, isLoading: isBatchesLoading, error: batchesError } = useQuery({
    queryKey: ['studentBatches', user?.userId],
    queryFn: async () => {
      if (!user?.userId) throw new Error('User ID required');
      return getStudentBatches(user.userId);
    },
    enabled: !!user?.userId
  });
  
  const { data: schedulesData, isLoading, error } = useQuery({
    queryKey: ['studentSchedules', studentBatchesData?.data],
    queryFn: async () => {
      if (!studentBatchesData?.success || !studentBatchesData.data || !Array.isArray(studentBatchesData.data)) {
        return { success: true, data: [] };
      }
      
      try {
        const batchIds = studentBatchesData.data
          .filter(sb => sb && sb.batch && sb.batch.batchId)
          .map(sb => sb.batch.batchId);
        
        if (batchIds.length === 0) {
          return { success: true, data: [] };
        }
        
        const schedulesPromises = batchIds.map(batchId => 
          getAllSchedules({ batchId })
        );
        
        const schedulesResults = await Promise.all(schedulesPromises);
        
        const allSchedules = schedulesResults.flatMap(result => 
          result.success && result.data ? result.data : []
        );
        
        return { success: true, data: allSchedules };
      } catch (error) {
        return { success: false, data: [], error: String(error) };
      }
    },
    enabled: !!studentBatchesData?.data && Array.isArray(studentBatchesData.data)
  });
  
  const schedules = schedulesData?.data || [];
  
  const groupedSchedules: Record<string, Schedule[]> = {};
  if (Array.isArray(schedules)) {
    schedules.forEach(schedule => {
      if (schedule && schedule.scheduleDate) {
        const dateKey = format(new Date(schedule.scheduleDate), 'yyyy-MM-dd');
        if (!groupedSchedules[dateKey]) {
          groupedSchedules[dateKey] = [];
        }
        groupedSchedules[dateKey].push(schedule);
      }
    });
  }
  
  const weekDays = [...Array(7)].map((_, i) => addDays(currentWeekStart, i));
  
  const currentWeekSchedules = Array.isArray(schedules) ? schedules.filter(schedule => {
    if (!schedule || !schedule.scheduleDate) return false;
    
    const scheduleDate = new Date(schedule.scheduleDate);
    scheduleDate.setHours(0, 0, 0, 0);
    
    return weekDays.some(day => {
      const compareDay = new Date(day);
      compareDay.setHours(0, 0, 0, 0);
      return scheduleDate.getTime() === compareDay.getTime();
    });
  }) : [];
  
  const upcomingSchedules = Array.isArray(schedules) ? schedules.filter(schedule => {
    if (!schedule || !schedule.scheduleDate || !schedule.startTime) return false;
    
    const scheduleDate = new Date(schedule.scheduleDate);
    const scheduleDateTime = new Date(scheduleDate);
    
    try {
      if (schedule.startTime.includes('T')) {
        const startTime = new Date(schedule.startTime);
        scheduleDateTime.setHours(startTime.getHours(), startTime.getMinutes());
      } else {
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        scheduleDateTime.setHours(hours, minutes);
      }
      
      const now = new Date();
      return scheduleDateTime > now;
    } catch (error) {
      return false;
    }
  }).sort((a, b) => {
    const dateA = new Date(a.scheduleDate);
    const dateB = new Date(b.scheduleDate);
    return dateA.getTime() - dateB.getTime();
  }) : [];
  
  const pastSchedules = Array.isArray(schedules) ? schedules.filter(schedule => {
    if (!schedule || !schedule.scheduleDate || !schedule.startTime) return false;
    
    const scheduleDate = new Date(schedule.scheduleDate);
    const scheduleDateTime = new Date(scheduleDate);
    
    try {
      if (schedule.startTime.includes('T')) {
        const startTime = new Date(schedule.startTime);
        scheduleDateTime.setHours(startTime.getHours(), startTime.getMinutes());
      } else {
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        scheduleDateTime.setHours(hours, minutes);
      }
      
      const now = new Date();
      return scheduleDateTime <= now;
    } catch (error) {
      return false;
    }
  }).sort((a, b) => {
    const dateB = new Date(b.scheduleDate);
    const dateA = new Date(a.scheduleDate);
    return dateB.getTime() - dateA.getTime();
  }) : [];
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => 
      direction === 'next' 
        ? addWeeks(prev, 1) 
        : addWeeks(prev, -1)
    );
  };
  
  const formatScheduleDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };
  
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        return format(date, 'h:mm a');
      }
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };
  
  const isLoaderShowing = isLoading || isBatchesLoading;
  
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['studentAttendance', user?.userId],
    queryFn: async () => {
      if (!user?.userId) return null;
      try {
        const response = await apiFetch<{
          overall: {
            total: number;
            present: number;
            absent: number;
            late: number;
            percentage: number;
          };
          byBatch: Array<{
            batchId: number;
            batchName: string;
            total: number;
            present: number;
            absent: number;
            late: number;
            percentage: number;
          }>;
          history: Array<{
            attendanceId: number;
            scheduleId: number;
            status: Status;
            markedAt: string;
            schedule: {
              topic: string;
              scheduleDate: string;
              startTime: string;
              endTime: string;
              batch: {
                batchName: string;
                instructor: {
                  fullName: string;
                };
              };
            };
            markedByUser: {
              fullName: string;
              role: Role;
            };
          }>;
        }>(`/attendance/analytics/student/${user.userId}`);
        
        if (!response.success) throw new Error(response.error);
        return response.data;
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        return null;
      }
    },
    enabled: !!user?.userId
  });
  
  // Updated to use the correct history endpoint
  const { data: attendanceHistoryData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['studentAttendanceHistory', user?.userId],
    queryFn: async () => {
      if (!user?.userId) return [];
      try {
        const response = await getStudentAttendanceHistory(user.userId);
        if (!response.success) {
          console.error("Failed to fetch attendance history:", response.error);
          return [];
        }
        return response.data || [];
      } catch (error) {
        console.error("Error in attendance history query:", error);
        return [];
      }
    },
    enabled: !!user?.userId
  });
  
  if (batchesError || error) {
    const errorMessage = batchesError instanceof Error 
      ? batchesError.message 
      : error instanceof Error 
        ? error.message 
        : 'Unknown error loading schedules';
    
    return (
      <div className="space-y-6">
        <BreadcrumbNav items={[
          { label: 'Schedules', link: '/student/schedules' }
        ]} />
        <h1 className="text-3xl font-bold">My Schedule</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error loading schedules: {errorMessage}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Schedules', link: '/student/schedules' }
      ]} />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">My Schedule</h1>
      </div>
      
      <Tabs defaultValue="weekly" className="w-full max-w-[1200px] px-4 space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="attendance">My Attendance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">
                Week of {format(currentWeekStart, 'MMMM d, yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                >
                  Previous Week
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateWeek('next')}
                >
                  Next Week
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              {isLoaderShowing ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : currentWeekSchedules.length > 0 ? (
                <div className="grid gap-4">
                  {weekDays.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const daySchedules = groupedSchedules[dateKey] || [];
                    
                    return (
                      <div key={dateKey} className="border rounded-md overflow-hidden">
                        <div className={`py-2 px-4 font-medium ${isToday(day) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {format(day, 'EEEE, MMMM d')}
                        </div>
                        
                        {daySchedules.length > 0 ? (
                          <div className="divide-y">
                            {daySchedules.map(schedule => (
                              <div key={schedule.scheduleId} className="p-4 hover:bg-muted/50">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <h4 className="font-medium">{schedule.topic || 'Class Session'}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                      </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      <span className="font-medium">Course:</span> {schedule.batch?.course?.courseName || 'Unknown Course'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      <span className="font-medium">Batch:</span> {schedule.batch?.batchName || 'Unknown Batch'}
                                    </div>
                                  </div>
                                  
                                  {schedule.meetingLink && (
                                    <Button asChild size="sm" className="bg-green-600 text-white hover:bg-green-700">
                                      <a href={schedule.meetingLink} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Join Meeting
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-muted-foreground">
                            No classes scheduled for this day
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                  <h3 className="text-lg font-medium">No classes this week</h3>
                  <p className="text-muted-foreground mt-1">
                    You don't have any classes scheduled for this week
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoaderShowing ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : upcomingSchedules.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSchedules.map(schedule => (
                    <div key={schedule.scheduleId} className="border rounded-md p-4 hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{schedule.topic || 'Class Session'}</h4>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{formatScheduleDate(schedule.scheduleDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="bg-muted/50">
                              {schedule.batch?.course?.courseName || 'Unknown Course'}
                            </Badge>
                            <Badge variant="outline" className="bg-muted/50">
                              {schedule.batch?.batchName || 'Unknown Batch'}
                            </Badge>
                          </div>
                        </div>
                        
                        {schedule.meetingLink && (
                          <Button asChild size="sm" className="bg-green-600 text-white hover:bg-green-700">
                            <a href={schedule.meetingLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Join Meeting
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                  <h3 className="text-lg font-medium">No upcoming classes</h3>
                  <p className="text-muted-foreground mt-1">
                    You don't have any upcoming classes scheduled
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendance" className="space-y-4">
          {isLoadingAttendance ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : attendanceData ? (
            <div className="w-full max-w-[1200px] space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{attendanceData.overall.percentage}%</div>
                    <Progress value={attendanceData.overall.percentage} className="mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Based on {attendanceData.overall.total} classes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {attendanceData.overall.present}/{attendanceData.overall.total}
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Present: {attendanceData.overall.present}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>Late: {attendanceData.overall.late}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Absent: {attendanceData.overall.absent}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Attendance Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center">
                      {attendanceData.overall.percentage >= 75 ? (
                        <div className="text-green-500 flex items-center">
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Good
                        </div>
                      ) : attendanceData.overall.percentage >= 60 ? (
                        <div className="text-yellow-500 flex items-center">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          Warning
                        </div>
                      ) : (
                        <div className="text-red-500 flex items-center">
                          <XCircle className="h-5 w-5 mr-2" />
                          Critical
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {attendanceData.overall.percentage >= 75
                        ? "You're doing great! Keep up the good attendance."
                        : attendanceData.overall.percentage >= 60
                        ? "Your attendance needs improvement. Try to attend more classes."
                        : "Your attendance is critically low. Please contact your instructor."}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {Array.isArray(attendanceData.byBatch) && attendanceData.byBatch.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Batch Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {attendanceData.byBatch.map((batch) => (
                        <div key={batch.batchId} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{batch.batchName}</div>
                            <div className="text-sm">
                              {batch.percentage}% ({batch.present}/{batch.total} classes)
                            </div>
                          </div>
                          <Progress value={batch.percentage} className="h-2" />
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              Present: {batch.present}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-yellow-500" />
                              Late: {batch.late}
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-500" />
                              Absent: {batch.absent}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Attendance History</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : attendanceHistoryData && attendanceHistoryData.length > 0 ? (
                    <div className="space-y-4">
                      {attendanceHistoryData.map((record) => (
                        <div key={record.attendanceId} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="font-medium">Topic: {record.schedule?.topic || 'Class Session'}</div>
                              <div className="text-sm text-muted-foreground">
                                {record.schedule?.scheduleDate && format(new Date(record.schedule.scheduleDate), 'PPP')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {record.schedule?.startTime && formatTime(record.schedule.startTime)} - 
                                {record.schedule?.endTime && formatTime(record.schedule.endTime)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Batch: {record.schedule?.batch?.batchName || 'Unknown Batch'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {record.status === 'present' && (
                                <div className="flex items-center text-green-500">
                                  <CheckCircle2 className="h-5 w-5 mr-1" />
                                  Present
                                </div>
                              )}
                              {record.status === 'absent' && (
                                <div className="flex items-center text-red-500">
                                  <XCircle className="h-5 w-5 mr-1" />
                                  Absent
                                </div>
                              )}
                              {record.status === 'late' && (
                                <div className="flex items-center text-yellow-500">
                                  <Clock className="h-5 w-5 mr-1" />
                                  Late
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Marked by: {record.markedByUser?.fullName || 'Unknown'} 
                            ({record.markedByUser?.role || 'User'}) 
                            {record.createdAt && format(new Date(record.createdAt), ' PPP p')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No attendance history available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No attendance data available
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
