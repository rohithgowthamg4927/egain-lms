
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, Calendar, Award, TrendingUp, Bell, AlertCircle } from "lucide-react";
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
  // Prepare data for the Category chart
  const categoryData = data?.popularCourses?.map((course) => ({
    name: course.course.category?.categoryName || 'Uncategorized',
    count: course._count.students,
  })) || [];

  // Group by category
  const categoriesMap = categoryData.reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = 0;
    }
    acc[item.name] += item.count;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array for the chart
  const categoryChartData = Object.entries(categoriesMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Prepare data for the Popular Courses chart
  const popularCoursesData = data?.popularCourses?.map((course) => ({
    name: course.course.courseName,
    students: course._count.students,
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
        <Card className="hover-scale">
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
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
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
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
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
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Batches</CardTitle>
            <CardDescription>Active learning groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <span className="text-3xl font-bold">{data?.counts?.batches || 0}</span>
              )}
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
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
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ddd' }} 
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
                <p>No course data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Students by Category</span>
            </CardTitle>
            <CardDescription>Distribution of students across different course categories</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryChartData.length > 0 ? (
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
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      animationDuration={1000}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} students`, 'Enrollment']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Award className="h-12 w-12 mb-2 opacity-20" />
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
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
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{schedule.topic}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{format(new Date(schedule.startTime), 'E, MMM d')}</span>
                      <span>{format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{schedule.batch.course.courseName}</p>
                    <p className="text-muted-foreground">{schedule.batch.batchName}</p>
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
