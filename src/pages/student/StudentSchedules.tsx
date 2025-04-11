
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getStudentSchedules } from '@/lib/api/students';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Schedule } from '@/lib/types';
import { format, parseISO, startOfWeek, addDays, isSameDay, addWeeks, isAfter, isBefore } from 'date-fns';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

export default function StudentSchedules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // Query for student schedules
  const { data: schedulesData, isLoading, error } = useQuery({
    queryKey: ['studentSchedules', user?.userId],
    queryFn: () => {
      if (!user?.userId) throw new Error('User ID required');
      return getStudentSchedules(user.userId);
    },
    enabled: !!user?.userId
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
    return weekDays.some(day => isSameDay(day, scheduleDate));
  });
  
  // Filter for upcoming schedules (after current date)
  const upcomingSchedules = schedules.filter(schedule => 
    isAfter(new Date(schedule.scheduleDate), new Date())
  ).sort((a, b) => 
    new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime()
  );
  
  // Filter for past schedules (before current date)
  const pastSchedules = schedules.filter(schedule => 
    isBefore(new Date(schedule.scheduleDate), new Date())
  ).sort((a, b) => 
    new Date(b.scheduleDate).getTime() - new Date(a.scheduleDate).getTime()
  );
  
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => 
      direction === 'next' 
        ? addWeeks(prev, 1) 
        : addWeeks(prev, -1)
    );
  };
  
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
          <TabsTrigger value="past">Past</TabsTrigger>
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
              {isLoading ? (
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
                        <div className={`py-2 px-4 font-medium ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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
                                      <span>{schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                      <span className="font-medium">Course:</span> {schedule.batch.course.courseName}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      <span className="font-medium">Batch:</span> {schedule.batch.batchName}
                                    </div>
                                  </div>
                                  
                                  {schedule.meetingLink && (
                                    <Button asChild variant="outline" size="sm">
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
              {isLoading ? (
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
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{format(parseISO(schedule.scheduleDate), 'EEEE, MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="bg-muted/50">
                              {schedule.batch.course.courseName}
                            </Badge>
                            <Badge variant="outline" className="bg-muted/50">
                              {schedule.batch.batchName}
                            </Badge>
                          </div>
                        </div>
                        
                        {schedule.meetingLink && (
                          <Button asChild variant="outline" size="sm">
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
        
        <TabsContent value="past" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Past Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pastSchedules.length > 0 ? (
                <div className="space-y-4">
                  {pastSchedules.map(schedule => (
                    <div key={schedule.scheduleId} className="border rounded-md p-4 hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{schedule.topic || 'Class Session'}</h4>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(parseISO(schedule.scheduleDate), 'EEEE, MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="bg-muted/50">
                              {schedule.batch.course.courseName}
                            </Badge>
                            <Badge variant="outline" className="bg-muted/50">
                              {schedule.batch.batchName}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                  <h3 className="text-lg font-medium">No past classes</h3>
                  <p className="text-muted-foreground mt-1">
                    You don't have any past classes
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
