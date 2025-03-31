
import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CalendarDays, GraduationCap, Lightbulb, BookOpenCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getUsers, getCourses, getBatches, getDashboardMetrics } from '@/lib/api';
import { Role } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { hasRole } = useAuth();

  // Fetch all data for the dashboard
  const getInstructorsQuery = useQuery({
    queryKey: ['instructors'],
    queryFn: () => getUsers(Role.instructor),
    enabled: hasRole([Role.admin]),
  });

  const getStudentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: () => getUsers(Role.student),
    enabled: hasRole([Role.admin]),
  });

  const getCoursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: () => getCourses(),
  });

  const getBatchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: () => getBatches(),
  });

  const getDashboardMetricsQuery = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => getDashboardMetrics(),
  });

  useEffect(() => {
    if (getInstructorsQuery.isError) {
      console.error('Error fetching instructors:', getInstructorsQuery.error);
    }
    if (getStudentsQuery.isError) {
      console.error('Error fetching students:', getStudentsQuery.error);
    }
    if (getCoursesQuery.isError) {
      console.error('Error fetching courses:', getCoursesQuery.error);
    }
    if (getBatchesQuery.isError) {
      console.error('Error fetching batches:', getBatchesQuery.error);
    }
    if (getDashboardMetricsQuery.isError) {
      console.error('Error fetching dashboard metrics:', getDashboardMetricsQuery.error);
    }
  }, [
    getInstructorsQuery.isError,
    getInstructorsQuery.error,
    getStudentsQuery.isError,
    getStudentsQuery.error,
    getCoursesQuery.isError,
    getCoursesQuery.error,
    getBatchesQuery.isError,
    getBatchesQuery.error,
    getDashboardMetricsQuery.isError,
    getDashboardMetricsQuery.error,
  ]);

  // Get the actual counts from the query responses
  const instructorsCount = getInstructorsQuery.data?.data?.length || 0;
  const studentsCount = getStudentsQuery.data?.data?.length || 0;
  const coursesCount = getCoursesQuery.data?.data?.length || 0;
  const batchesCount = getBatchesQuery.data?.data?.length || 0;

  // Prepare data for the chart
  // If we have dashboard metrics, use them, otherwise create dummy data from our other queries
  let coursesPerCategory = [];
  
  if (getDashboardMetricsQuery.data?.data?.coursesPerCategory) {
    coursesPerCategory = getDashboardMetricsQuery.data.data.coursesPerCategory;
  } else if (getCoursesQuery.data?.data) {
    // Group courses by category
    const coursesByCategory = getCoursesQuery.data.data.reduce((acc, course) => {
      const categoryName = course.category?.categoryName || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = 0;
      }
      acc[categoryName]++;
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to array format for chart
    coursesPerCategory = Object.entries(coursesByCategory).map(([categoryName, count]) => ({
      categoryName,
      count,
    }));
  }

  const chartData = {
    labels: coursesPerCategory.map((item) => item.categoryName),
    datasets: [
      {
        label: 'Number of Courses',
        data: coursesPerCategory.map((item) => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Courses per Category',
      },
    },
  };

  // Get recent enrollments from metrics or prepare empty array
  const recentEnrollments = getDashboardMetricsQuery.data?.data?.recentEnrollments || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getInstructorsQuery.isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  instructorsCount
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {getInstructorsQuery.isLoading
                  ? 'Loading...'
                  : `${instructorsCount} instructors in the platform`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getStudentsQuery.isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  studentsCount
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {getStudentsQuery.isLoading
                  ? 'Loading...'
                  : `${studentsCount} students enrolled`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getCoursesQuery.isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  coursesCount
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {getCoursesQuery.isLoading ? 'Loading...' : `${coursesCount} courses available`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getBatchesQuery.isLoading ? (
                  <Skeleton className="h-5 w-20" />
                ) : (
                  batchesCount
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {getBatchesQuery.isLoading ? 'Loading...' : `${batchesCount} active batches`}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Courses per Category</CardTitle>
              <CardDescription>Number of courses available in each category.</CardDescription>
            </CardHeader>
            <CardContent>
              {getCoursesQuery.isLoading ? (
                <Skeleton className="h-[300px]" />
              ) : coursesPerCategory.length > 0 ? (
                <Bar options={chartOptions} data={chartData} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No course data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
              <CardDescription>Latest students who have enrolled in courses.</CardDescription>
            </CardHeader>
            <CardContent className="pl-4">
              {getStudentsQuery.isLoading || getCoursesQuery.isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-[75%]" />
                  <Skeleton className="h-4 w-[50%]" />
                  <Skeleton className="h-4 w-[60%]" />
                </div>
              ) : recentEnrollments.length > 0 ? (
                <ul className="list-none space-y-4">
                  {recentEnrollments.map((enrollment, index) => (
                    <li key={index} className="border-l-2 border-primary pl-4">
                      <div className="font-medium">{enrollment.studentName}</div>
                      <div className="text-sm text-muted-foreground">
                        Enrolled in <span className="font-medium">{enrollment.courseName}</span> on{' '}
                        {new Date(enrollment.date).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent enrollments found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
