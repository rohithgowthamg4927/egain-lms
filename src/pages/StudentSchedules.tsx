
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getStudentSchedules } from '@/lib/api/students';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Clock, Globe, Search, Users, VideoIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const StudentSchedules = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Get student's schedules
  const schedulesQuery = useQuery({
    queryKey: ['studentSchedules', user?.userId],
    queryFn: () => (user?.userId ? getStudentSchedules(user.userId) : Promise.resolve({ success: false, data: [] })),
    enabled: !!user?.userId,
  });
  
  const isLoading = schedulesQuery.isLoading;
  const schedules = schedulesQuery.data?.data || [];
  
  // Filter schedules based on search and date
  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch = searchQuery
      ? (schedule.batch?.course?.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         schedule.batch?.batchName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         schedule.topic?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
      
    const matchesDate = date
      ? isSameDay(parseISO(schedule.scheduleDate), date)
      : true;
      
    return matchesSearch && matchesDate;
  });
  
  // Group schedules by date
  const groupedSchedules = filteredSchedules.reduce((groups, schedule) => {
    const date = format(parseISO(schedule.scheduleDate), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(schedule);
    return groups;
  }, {} as Record<string, typeof schedules>);
  
  // Sort dates
  const sortedDates = Object.keys(groupedSchedules).sort();
  
  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Schedules', link: '/schedules' }
      ]} />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">My Class Schedule</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-3/4 space-y-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Classes</CardTitle>
                  <CardDescription>
                    All scheduled classes for your enrolled courses
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-60">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search schedules..."
                      className="w-full pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[280px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDate(undefined)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredSchedules.length === 0 ? (
                <div className="text-center py-10">
                  <h3 className="text-lg font-medium">No classes found</h3>
                  <p className="text-muted-foreground mt-1">
                    {searchQuery || date ? 'Try different filters' : 'No upcoming classes scheduled'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedDates.map(dateStr => (
                    <div key={dateStr} className="space-y-3">
                      <h3 className="font-medium text-lg flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        {format(parseISO(dateStr), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <div className="space-y-3">
                        {groupedSchedules[dateStr].map(schedule => (
                          <Card key={schedule.scheduleId} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold text-lg">
                                    {schedule.batch?.course?.courseName}
                                  </h4>
                                  <p className="text-muted-foreground">
                                    Batch: {schedule.batch?.batchName}
                                  </p>
                                  {schedule.topic && (
                                    <p className="mt-2">{schedule.topic}</p>
                                  )}
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center gap-1 mb-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {schedule.startTime && format(parseISO(schedule.startTime), 'h:mm a')} - 
                                      {schedule.endTime && format(parseISO(schedule.endTime), 'h:mm a')}
                                    </span>
                                  </div>
                                  <Badge 
                                    variant={schedule.meetingLink ? "default" : "outline"}
                                    className="flex items-center gap-1"
                                  >
                                    {schedule.meetingLink ? 
                                      <><VideoIcon className="h-3 w-3" /> Online</> : 
                                      <><Globe className="h-3 w-3" /> In-person</>
                                    }
                                  </Badge>
                                </div>
                              </div>
                              
                              {schedule.meetingLink && (
                                <div className="mt-4 pt-3 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    asChild
                                  >
                                    <a href={schedule.meetingLink} target="_blank" rel="noopener noreferrer">
                                      <VideoIcon className="h-4 w-4" />
                                      Join Meeting
                                    </a>
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
              <CardDescription>Your upcoming classes this week</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules
                    .filter(schedule => {
                      const scheduleDate = parseISO(schedule.scheduleDate);
                      const today = new Date();
                      const nextWeek = addDays(today, 7);
                      return scheduleDate >= today && scheduleDate <= nextWeek;
                    })
                    .slice(0, 5)
                    .map(schedule => (
                      <div key={schedule.scheduleId} className="flex items-center p-2 hover:bg-muted rounded-md -mx-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center text-primary mr-3">
                          <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{schedule.batch?.course?.courseName}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(schedule.scheduleDate), 'E, MMM d')} • {schedule.startTime && format(parseISO(schedule.startTime), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  
                  {schedules.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      No classes scheduled for this week
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentSchedules;
