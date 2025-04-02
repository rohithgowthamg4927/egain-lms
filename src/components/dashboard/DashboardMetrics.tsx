
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, Calendar, Award, TrendingUp, Bell, AlertCircle, PieChart as PieChartIcon, Tag, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DashboardMetrics as DashboardMetricsType } from "@/lib/types";
import { format } from "date-fns";

interface DashboardMetricsProps {
  data?: DashboardMetricsType;
  isLoading: boolean;
  isError: boolean;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f97316', '#10b981', '#14b8a6'];

const DashboardMetrics = ({ data, isLoading, isError }: DashboardMetricsProps) => {
  // Use optional chaining for categoryDistribution
  const categoryChartData = data?.categoryDistribution || [];

  // Prepare data for the Popular Courses chart
  const popularCoursesData = data?.popularCourses?.map((course) => ({
    name: course.course.courseName,
    students: course._count.students,
  })) || [];

  // Prepare data for Courses by Category
  const coursesByCategoryData = data?.coursesByCategory?.map((category) => ({
    name: category.name,
    courses: category.courseCount,
  })) || [];

  // Format upcoming schedule items
  const upcomingSchedules = data?.upcomingSchedules || [];

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
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <Card className="hover-scale shadow-md border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <CardDescription>Course categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span className="text-3xl font-bold">{data?.counts?.categories || 0}</span>
              )}
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
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
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white' }} 
                      formatter={(value) => [`${value} students`, 'Enrollment']}
                    />
                    <Bar 
                      dataKey="students" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <BookOpen className="h-12 w-12 mb-2 opacity-20" />
                <p>No course data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              <span>Courses by Category</span>
            </CardTitle>
            <CardDescription>Distribution of courses across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : coursesByCategoryData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={coursesByCategoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ddd', backgroundColor: 'white' }} 
                      formatter={(value) => [`${value} courses`, 'Count']}
                    />
                    <Bar 
                      dataKey="courses" 
                      fill="#8b5cf6" 
                      radius={[0, 4, 4, 0]}
                      animationDuration={1000}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Tag className="h-12 w-12 mb-2 opacity-20" />
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span>Upcoming Schedule</span>
          </CardTitle>
          <CardDescription>Next classes and events</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : upcomingSchedules.length > 0 ? (
            <div className="space-y-4">
              {upcomingSchedules.map((schedule) => (
                <div key={schedule.scheduleId} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors">
                  <div className="bg-blue-600/10 p-3 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{schedule.topic}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{format(new Date(schedule.startTime), 'E, MMM d')}</span>
                      <span>{format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{schedule.batch?.course?.courseName || 'N/A'}</p>
                    <p className="text-muted-foreground">{schedule.batch?.batchName || 'N/A'}</p>
                  </div>
                </div>
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
  );
};

export default DashboardMetrics;
