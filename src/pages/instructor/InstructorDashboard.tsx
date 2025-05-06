import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getInstructorCourses } from '@/lib/api/instructors';
import { getAllSchedules } from '@/lib/api/schedules';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Award,
  GraduationCap,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, addDays, isAfter, isBefore } from 'date-fns';

// Add utility functions for date/time handling
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

const formatScheduleDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'PPP');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

const getScheduleDateTime = (schedule: any) => {
  try {
    const scheduleDate = new Date(schedule.scheduleDate);
    const scheduleDateTime = new Date(scheduleDate);
    
    if (schedule.startTime.includes('T')) {
      const startTime = new Date(schedule.startTime);
      scheduleDateTime.setHours(startTime.getHours(), startTime.getMinutes());
    } else {
      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      scheduleDateTime.setHours(hours, minutes);
    }
    
    return scheduleDateTime;
  } catch (error) {
    console.error('Error creating schedule datetime:', error);
    return null;
  }
};

const InstructorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const instructorId = user?.userId;
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Fetch instructor courses
  const {
    data: coursesData,
    isLoading: isCoursesLoading,
    error: coursesError,
  } = useQuery({
    queryKey: ['instructorCourses', instructorId],
    queryFn: () => instructorId ? getInstructorCourses(instructorId) : Promise.resolve({ success: false, data: [] }),
    enabled: !!instructorId,
  });

  // Fetch schedules using the same API as Schedules.tsx, filtered by instructorId
  const { data: schedulesData, isLoading: isLoadingSchedules, error: schedulesError } = useQuery({
    queryKey: ['instructorSchedules', instructorId],
    queryFn: () => instructorId ? getAllSchedules({ instructorId }) : Promise.resolve({ success: false, data: [] }),
    enabled: !!instructorId,
  });
  const schedules = schedulesData?.data || [];

  useEffect(() => {
    if (coursesError) {
      toast({
        title: 'Error fetching courses',
        description: 'Could not load your courses. Please try again later.',
        variant: 'destructive',
      });
    }

    if (schedulesError) {
      toast({
        title: 'Error fetching schedules',
        description: 'Could not load your schedules. Please try again later.',
        variant: 'destructive',
      });
    }
  }, [coursesError, schedulesError, toast]);

  // Process courses data for metrics
  const courses = coursesData?.data || [];
  const totalCourses = courses.length;
  const totalStudents = courses.reduce((acc, course) => acc + (course._count?.studentCourses || 0), 0);
  const totalBatches = courses.reduce((acc, course) => acc + (course._count?.batches || 0), 0);

  // Use the fetched schedules for upcoming classes
  const now = new Date();
  now.setSeconds(0, 0);
  const todaySchedules = schedules.filter(schedule => {
    try {
      const scheduleDate = new Date(schedule.scheduleDate);
      const scheduleDateTime = new Date(scheduleDate);
      if (schedule.startTime.includes('T')) {
        const startTime = new Date(schedule.startTime);
        scheduleDateTime.setHours(startTime.getHours(), startTime.getMinutes());
      } else {
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        scheduleDateTime.setHours(hours, minutes);
      }
      return isToday(scheduleDate) && scheduleDateTime > now;
    } catch (error) {
      return false;
    }
  }).sort((a, b) => {
    const dateTimeA = getScheduleDateTime(a);
    const dateTimeB = getScheduleDateTime(b);
    if (!dateTimeA || !dateTimeB) return 0;
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

  const tomorrowSchedules = schedules.filter(schedule => {
    try {
      const scheduleDate = new Date(schedule.scheduleDate);
      return isTomorrow(scheduleDate);
    } catch (error) {
      return false;
    }
  }).sort((a, b) => {
    const dateTimeA = getScheduleDateTime(a);
    const dateTimeB = getScheduleDateTime(b);
    if (!dateTimeA || !dateTimeB) return 0;
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

  const nextWeekSchedules = schedules.filter(schedule => {
    try {
      const scheduleDate = new Date(schedule.scheduleDate);
      const scheduleDateTime = getScheduleDateTime(schedule);
      const nextWeek = addDays(now, 7);
      if (!scheduleDateTime) return false;
      return scheduleDateTime > now && !isToday(scheduleDate) && !isTomorrow(scheduleDate) && scheduleDateTime <= nextWeek;
    } catch (error) {
      return false;
    }
  }).sort((a, b) => {
    const dateTimeA = getScheduleDateTime(a);
    const dateTimeB = getScheduleDateTime(b);
    if (!dateTimeA || !dateTimeB) return 0;
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

  // Chart data for courses per category
  const categoryData = courses.reduce((acc, course) => {
    const categoryName = course.category?.categoryName || 'Uncategorized';
    const existingCategory = acc.find(cat => cat.name === categoryName);
    
    if (existingCategory) {
      existingCategory.value += 1;
    } else {
      acc.push({ name: categoryName, value: 1 });
    }
    
    return acc;
  }, [] as { name: string; value: number }[]);

  // Chart data for student enrollment per course
  const enrollmentData = courses.map(course => ({
    name: course.courseName.length > 20 ? course.courseName.substring(0, 20) + '...' : course.courseName,
    students: course._count?.studentCourses || 0,
  })).sort((a, b) => b.students - a.students).slice(0, 5);

  // Pie chart colors
  const COLORS = ['#7E69AB', '#9b87f5', '#D6BCFA', '#E9D8FD', '#FAF5FF'];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.fullName || 'Instructor'}</h1>
        <p className="text-gray-600 mt-2">Here's an overview of your teaching activities and schedules</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <BookOpen className="text-purple-500 h-5 w-5" />
              Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{totalCourses}</div>
            <p className="text-sm text-gray-500 mt-1">Courses you're teaching</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Users className="text-indigo-500 h-5 w-5" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700">{totalStudents}</div>
            <p className="text-sm text-gray-500 mt-1">Total enrolled students</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <GraduationCap className="text-blue-500 h-5 w-5" />
              Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{totalBatches}</div>
            <p className="text-sm text-gray-500 mt-1">Active teaching batches</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming Schedule Section */}
        <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="text-purple-600 h-5 w-5" />
              Upcoming Classes
            </CardTitle>
            <CardDescription>Your teaching schedule for the coming days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSchedules ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              </div>
            ) : todaySchedules.length === 0 && tomorrowSchedules.length === 0 && nextWeekSchedules.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No upcoming classes scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaySchedules.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                      <Badge variant="secondary" className="mr-2 bg-purple-100 text-purple-800 hover:bg-purple-200">Today</Badge>
                    </h3>
                    <div className="space-y-2">
                      {todaySchedules.map((schedule) => (
                        <div 
                          key={schedule.scheduleId} 
                          className="p-3 border rounded-lg flex items-center gap-4 bg-gradient-to-r from-purple-50 to-white"
                        >
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Clock className="h-5 w-5 text-purple-700" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{schedule.batch?.course?.courseName || 'Untitled Course'}</div>
                            <div className="text-sm text-gray-600">
                              {formatTime(schedule.startTime)}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => navigate('/schedules')}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tomorrowSchedules.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                      <Badge variant="secondary" className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-200">Tomorrow</Badge>
                    </h3>
                    <div className="space-y-2">
                      {tomorrowSchedules.map((schedule) => (
                        <div 
                          key={schedule.scheduleId} 
                          className="p-3 border rounded-lg flex items-center gap-4 bg-gradient-to-r from-blue-50 to-white"
                        >
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Clock className="h-5 w-5 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{schedule.batch?.course?.courseName || 'Untitled Course'}</div>
                            <div className="text-sm text-gray-600">
                              {formatTime(schedule.startTime)}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => navigate('/schedules')}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {nextWeekSchedules.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                      <Badge variant="secondary" className="mr-2 bg-indigo-100 text-indigo-800 hover:bg-indigo-200">This Week</Badge>
                    </h3>
                    <div className="space-y-2">
                      {nextWeekSchedules.map((schedule) => (
                        <div 
                          key={schedule.scheduleId} 
                          className="p-3 border rounded-lg flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-white"
                        >
                          <div className="bg-indigo-100 p-2 rounded-lg">
                            <Calendar className="h-5 w-5 text-indigo-700" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{schedule.batch?.course?.courseName || 'Untitled Course'}</div>
                            <div className="text-sm text-gray-600">
                              {formatScheduleDate(schedule.scheduleDate)} • {formatTime(schedule.startTime)}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => navigate('/schedules')}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={() => navigate('/schedules')}
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              View All Schedules
            </Button>
          </CardFooter>
        </Card>

        {/* Course Distribution */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="text-purple-600 h-5 w-5" />
              Teaching Portfolio
            </CardTitle>
            <CardDescription>Distribution of your courses by category</CardDescription>
          </CardHeader>
          <CardContent>
            {isCoursesLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No courses assigned yet</p>
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Courses`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Courses Section */}
      <Card className="shadow-sm hover:shadow-md transition-shadow mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-purple-600 h-5 w-5" />
            Popular Courses
          </CardTitle>
          <CardDescription>Your courses with the highest student enrollment</CardDescription>
        </CardHeader>
        <CardContent>
          {isCoursesLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
            </div>
          ) : enrollmentData.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No student enrollment data available</p>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={enrollmentData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis name="Students" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    name="Enrolled Students" 
                    dataKey="students" 
                    fill="#9b87f5" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => navigate('/courses')}
            className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            View All Courses
          </Button>
        </CardFooter>
      </Card>
      
      {/* Quick Actions */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used instructor actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-center justify-center gap-2 border-purple-200 text-purple-800 hover:bg-purple-50"
              onClick={() => navigate('/schedules')}
            >
              <Calendar className="h-6 w-6" />
              <span>View Schedule</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-center justify-center gap-2 border-indigo-200 text-indigo-800 hover:bg-indigo-50"
              onClick={() => navigate('/courses')}
            >
              <BookOpen className="h-6 w-6" />
              <span>Browse Courses</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-center justify-center gap-2 border-blue-200 text-blue-800 hover:bg-blue-50"
              onClick={() => navigate('/batches')}
            >
              <Users className="h-6 w-6" />
              <span>View Batches</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-6 flex flex-col items-center justify-center gap-2 border-teal-200 text-teal-800 hover:bg-teal-50"
              onClick={() => navigate('/resources')}
            >
              <FileText className="h-6 w-6" />
              <span>Manage Resources</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorDashboard;
