
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isToday, isTomorrow, addDays, isAfter, isBefore } from 'date-fns';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  GraduationCap, 
  FileText, 
  Users, 
  CheckCircle, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Query for student batches - retrieve all batches the student is enrolled in
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
  const { data: schedulesData, isLoading: isSchedulesLoading, error } = useQuery({
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
        fetch(`/api/schedules?batchId=${batchId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json())
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
  
  // Process schedules data for upcoming classes
  const schedules = schedulesData?.data || [];
  const now = new Date();
  
  // Today's schedules
  const todaySchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.scheduleDate);
    return isToday(scheduleDate);
  }).sort((a, b) => {
    // Extract time from startTime string
    const getTimeFromString = (timeStr) => {
      if (timeStr.includes('T')) {
        return new Date(timeStr);
      }
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };
    
    const timeA = getTimeFromString(a.startTime);
    const timeB = getTimeFromString(b.startTime);
    
    return timeA.getTime() - timeB.getTime();
  });
  
  // Tomorrow's schedules
  const tomorrowSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.scheduleDate);
    return isTomorrow(scheduleDate);
  }).sort((a, b) => {
    // Extract time from startTime string
    const getTimeFromString = (timeStr) => {
      if (timeStr.includes('T')) {
        return new Date(timeStr);
      }
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };
    
    const timeA = getTimeFromString(a.startTime);
    const timeB = getTimeFromString(b.startTime);
    
    return timeA.getTime() - timeB.getTime();
  });
  
  // Upcoming schedules (next 7 days)
  const upcomingSchedules = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.scheduleDate);
    const nextWeek = addDays(now, 7);
    
    return isAfter(scheduleDate, now) && 
           !isToday(scheduleDate) && 
           !isTomorrow(scheduleDate) && 
           isBefore(scheduleDate, nextWeek);
  }).sort((a, b) => {
    const dateA = new Date(a.scheduleDate);
    const dateB = new Date(b.scheduleDate);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Format times correctly
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      // For full ISO string
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
  
  // Query for enrolled courses
  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['studentCourses', user?.userId],
    queryFn: async () => {
      if (!user?.userId) throw new Error('User ID required');
      return await fetch(`/api/students/${user.userId}/courses`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
    },
    enabled: !!user?.userId
  });
  
  const enrolledCourses = coursesData?.data || [];
  const isLoading = isCoursesLoading || isSchedulesLoading || isBatchesLoading;
  
  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Dashboard', link: '/student/dashboard' }
      ]} />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Welcome, {user?.fullName}</h1>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="text-primary h-5 w-5" />
              My Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl font-bold">{enrolledCourses.length}</div>
            )}
            <p className="text-muted-foreground mt-1">Enrolled courses</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/student/courses')}
            >
              View Courses
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="text-primary h-5 w-5" />
              Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl font-bold">{todaySchedules.length}</div>
            )}
            <p className="text-muted-foreground mt-1">Classes today</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/student/schedules')}
            >
              View Schedule
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="text-primary h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-24" />
            ) : (
              <div className="text-3xl font-bold">-</div>
            )}
            <p className="text-muted-foreground mt-1">Learning materials</p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/student/resources')}
            >
              Access Resources
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Upcoming Classes Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Classes
          </CardTitle>
          <CardDescription>Your scheduled learning sessions</CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Today's Classes */}
              {todaySchedules.length > 0 && (
                <div>
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700 border-blue-200">Today</Badge>
                  </h3>
                  <div className="space-y-3">
                    {todaySchedules.map((schedule) => (
                      <div 
                        key={schedule.scheduleId} 
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{schedule.topic || "Class Session"}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
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
                </div>
              )}
              
              {/* Tomorrow's Classes */}
              {tomorrowSchedules.length > 0 && (
                <div>
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <Badge variant="outline" className="mr-2 bg-indigo-50 text-indigo-700 border-indigo-200">Tomorrow</Badge>
                  </h3>
                  <div className="space-y-3">
                    {tomorrowSchedules.map((schedule) => (
                      <div 
                        key={schedule.scheduleId} 
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{schedule.topic || "Class Session"}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
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
                </div>
              )}
              
              {/* Upcoming Classes (Next 7 days) */}
              {upcomingSchedules.length > 0 && (
                <div>
                  <h3 className="font-medium text-lg mb-3 flex items-center">
                    <Badge variant="outline" className="mr-2 bg-purple-50 text-purple-700 border-purple-200">Upcoming</Badge>
                  </h3>
                  <div className="space-y-3">
                    {upcomingSchedules.map((schedule) => (
                      <div 
                        key={schedule.scheduleId} 
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{schedule.topic || "Class Session"}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(schedule.scheduleDate), 'EEEE, MMMM d')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
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
                </div>
              )}
              
              {/* No classes message */}
              {todaySchedules.length === 0 && tomorrowSchedules.length === 0 && upcomingSchedules.length === 0 && (
                <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No upcoming classes</h3>
                  <p className="text-muted-foreground mt-2">
                    You don't have any classes scheduled for the next few days
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/student/schedules')}
          >
            View Full Schedule
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used student actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50"
              onClick={() => navigate('/student/courses')}
            >
              <BookOpen className="h-6 w-6 text-primary" />
              <span>My Courses</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50"
              onClick={() => navigate('/student/schedules')}
            >
              <Calendar className="h-6 w-6 text-primary" />
              <span>Class Schedule</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50"
              onClick={() => navigate('/student/resources')}
            >
              <FileText className="h-6 w-6 text-primary" />
              <span>Resources</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50"
              onClick={() => navigate('/profile')}
            >
              <Users className="h-6 w-6 text-primary" />
              <span>My Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
