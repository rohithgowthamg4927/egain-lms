
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getStudentSchedules } from '@/lib/api/students';
import { getAllSchedules } from '@/lib/api/schedules';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Schedule } from '@/lib/types';
import { format, parseISO, startOfWeek, addDays, isSameDay, addWeeks, isAfter, isBefore, isToday } from 'date-fns';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

export default function StudentSchedules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Query for student schedules - updated to include batches the student is enrolled in
  const { data: studentBatchesData, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['studentBatches', user?.userId],
    queryFn: async () => {
      if (!user?.userId) throw new Error('User ID required');
      return await fetch(`/api/student-batches/${user.userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
    },
    enabled: !!user?.userId
  });
  
  // Get all schedules for batches the student is enrolled in
  const { data: schedulesData, isLoading, error } = useQuery({
    queryKey: ['studentSchedules', studentBatchesData?.data],
    queryFn: async () => {
      if (!studentBatchesData?.success || !studentBatchesData.data) {
        throw new Error('No batches found');
      }
      
      // Extract batch IDs from student batches
      const batchIds = studentBatchesData.data.map(sb => sb.batch.batchId);
      if (batchIds.length === 0) return { success: true, data: [] };
      
      // Fetch all schedules for these batches
      const schedulesPromises = batchIds.map(batchId => 
        getAllSchedules({ batchId })
      );
      
      const schedulesResults = await Promise.all(schedulesPromises);
      
      // Combine all schedules from different batches
      const allSchedules = schedulesResults.flatMap(result => 
        result.success && result.data ? result.data : []
      );
      
      return { success: true, data: allSchedules };
    },
    enabled: !!studentBatchesData?.data
  });
  
  const schedules = schedulesData?.data || [];
  
  // Group schedules by date
  const groupedSchedules: Record<string, Schedule[]> = {};
  schedules.forEach(schedule => {
    const dateKey = format(new Date(schedule.scheduleDate), 'yyyy-MM-dd');
    if (!groupedSchedules[dateKey]) {
      groupedSchedules[dateKey] = [];
    }
    groupedSchedules[dateKey].push(schedule);
  });
  
  // Get current week days
  const weekDays = [...Array(7)].map((_, i) => addDays(currentWeekStart, i));
  
  // Filter schedules for current week
  const currentWeekSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.scheduleDate);
    // Reset time part to compare only dates
    scheduleDate.setHours(0, 0, 0, 0);
    
    return weekDays.some(day => {
      const compareDay = new Date(day);
      compareDay.setHours(0, 0, 0, 0);
      return scheduleDate.getTime() === compareDay.getTime();
    });
  });
  
  // Filter for upcoming schedules (after current date)
  const upcomingSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.scheduleDate);
    const scheduleDateTime = new Date(scheduleDate);
    
    // Get time parts from startTime
    if (schedule.startTime.includes('T')) {
      const startTime = new Date(schedule.startTime);
      scheduleDateTime.setHours(startTime.getHours(), startTime.getMinutes());
    } else {
      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      scheduleDateTime.setHours(hours, minutes);
    }
    
    const now = new Date();
    return scheduleDateTime > now;
  }).sort((a, b) => {
    const dateA = new Date(a.scheduleDate);
    const dateB = new Date(b.scheduleDate);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Filter for past schedules (before current date)
  const pastSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.scheduleDate);
    const scheduleDateTime = new Date(scheduleDate);
    
    // Get time parts from startTime
    if (schedule.startTime.includes('T')) {
      const startTime = new Date(schedule.startTime);
      scheduleDateTime.setHours(startTime.getHours(), startTime.getMinutes());
    } else {
      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      scheduleDateTime.setHours(hours, minutes);
    }
    
    const now = new Date();
    return scheduleDateTime <= now;
  }).sort((a, b) => {
    const dateB = new Date(b.scheduleDate);
    const dateA = new Date(a.scheduleDate);
    return dateB.getTime() - dateA.getTime();
  });
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => 
      direction === 'next' 
        ? addWeeks(prev, 1) 
        : addWeeks(prev, -1)
    );
  };
  
  // Format date to display in UI
  const formatScheduleDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };
  
  // Modify the formatTime helper function to handle timezone correctly
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      // For full ISO string (from database)
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        return format(date, 'h:mm a');
      }
      // For time-only string (HH:mm:ss)
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
  
  if (error) {
    return (
      <div className="space-y-6">
        <BreadcrumbNav items={[
          { label: 'Schedules', link: '/student/schedules' }
        ]} />
        <h1 className="text-3xl font-bold">My Schedule</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error loading schedules. Please try again later.</p>
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
      
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
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
                                      <span className="font-medium">Course:</span> {schedule.batch?.course?.courseName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      <span className="font-medium">Batch:</span> {schedule.batch?.batchName}
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
                              {schedule.batch?.course?.courseName}
                            </Badge>
                            <Badge variant="outline" className="bg-muted/50">
                              {schedule.batch?.batchName}
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
      </Tabs>
    </div>
  );
}
