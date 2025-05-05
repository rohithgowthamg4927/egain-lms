import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, Calendar, Award, TrendingUp, Bell, AlertCircle, PieChart as PieChartIcon, BarChart as BarChartIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DashboardMetrics as DashboardMetricsType } from "@/lib/types";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface DashboardMetricsProps {
  data?: DashboardMetricsType;
  isLoading: boolean;
  isError: boolean;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f97316', '#10b981', '#14b8a6'];

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

const DashboardMetrics = ({ data, isLoading, isError }: DashboardMetricsProps) => {
  
  const categoryChartData = data?.categoryDistribution?.filter(cat => cat.value > 0) || [];
  
  const coursesByCategoryData = data?.coursesByCategory?.map((category) => ({
    name: category.categoryName,
    courses: category.coursesCount || 0,
  })) || [];

  const popularCoursesData = data?.popularCourses?.map((course) => ({
    name: course.course.courseName,
    students: course._count?.students || 0,
  })) || [];

  const upcomingSchedules = data?.upcomingSchedules || [];

  // Update schedule filtering and sorting
  const now = new Date();
  now.setSeconds(0, 0); // Normalize seconds and milliseconds

  const filteredUpcomingSchedules = upcomingSchedules
    .filter(schedule => {
      try {
        const scheduleDateTime = getScheduleDateTime(schedule);
        return scheduleDateTime ? scheduleDateTime > now : false;
      } catch (error) {
        console.error('Error filtering upcoming schedules:', error);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const dateTimeA = getScheduleDateTime(a);
        const dateTimeB = getScheduleDateTime(b);
        
        if (!dateTimeA || !dateTimeB) return 0;
        
        return dateTimeA.getTime() - dateTimeB.getTime();
      } catch (error) {
        console.error('Error sorting upcoming schedules:', error);
        return 0;
      }
    })
    .slice(0, 5); // Keep only the first 5 upcoming schedules

  if (isError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load dashboard metrics. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-scale shadow-md border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <CardDescription>Total enrolled students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span className="text-3xl font-bold">{data?.counts?.students || 0}</span>
              )}
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale shadow-md border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <CardDescription>Active instructors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span className="text-3xl font-bold">{data?.counts?.instructors || 0}</span>
              )}
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale shadow-md border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <CardDescription>Available courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span className="text-3xl font-bold">{data?.counts?.courses || 0}</span>
              )}
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5" />
              <span>Courses by Category</span>
            </CardTitle>
            <CardDescription>Distribution of courses across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : coursesByCategoryData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={coursesByCategoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      angle={0} 
                      textAnchor="middle" 
                      height={50} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                      domain={[0, 'dataMax + 1']}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white' }} 
                      formatter={(value) => [`${value} courses`, 'Count']}
                    />
                    <Bar 
                      dataKey="courses" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <BarChartIcon className="h-12 w-12 mb-2 opacity-20" />
                <p>No course data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span>Popular Courses</span>
            </CardTitle>
            <CardDescription>Top courses by student enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : popularCoursesData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={popularCoursesData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70} 
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                      domain={[0, 'dataMax + 1']}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white' }} 
                      formatter={(value) => [`${value} students`, 'Enrollment']}
                    />
                    <Bar 
                      dataKey="students" 
                      fill="#8b5cf6" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <BookOpen className="h-12 w-12 mb-2 opacity-20" />
                <p>No course enrollment data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              <span>Students by Category</span>
            </CardTitle>
            <CardDescription>Distribution of students across different course categories</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryChartData.length > 0 && categoryChartData.some(item => item.value > 0) ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      innerRadius={30}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => 
                        percent > 0 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                      animationDuration={1000}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} students`, 'Enrollment']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Award className="h-12 w-12 mb-2 opacity-20" />
                <p>No student enrollment data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span>Upcoming Schedules</span>
            </CardTitle>
            <CardDescription>Next classes with Dates</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredUpcomingSchedules && filteredUpcomingSchedules.length > 0 ? (
              <div className="space-y-4">
                {filteredUpcomingSchedules.map((schedule, index) => (
                  <Link 
                    to={`/schedules`}
                    key={schedule.scheduleId}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="bg-blue-600/10 p-3 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{schedule.topic}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {formatScheduleDate(schedule.scheduleDate)}
                        </span>
                        <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{schedule.batch?.course?.courseName || 'N/A'}</p>
                      <p className="text-muted-foreground">{schedule.batch?.batchName || 'N/A'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Calendar className="h-12 w-12 mb-2 opacity-20" />
                <p>No upcoming schedules found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardMetrics;
