
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import Layout from '@/components/layout/Layout';
import { fetchCourses, fetchUsers, getDashboardMetrics } from '@/lib/api';
import { Role, DashboardMetrics as DashboardMetricsType } from '@/lib/types';

const Dashboard = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalInstructors, setTotalInstructors] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [metrics, setMetrics] = useState<DashboardMetricsType | null>(null);

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: () => fetchCourses(),
  });
  
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(),
  });
  
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => fetchUsers(Role.INSTRUCTOR),
  });
  
  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => fetchUsers(Role.STUDENT),
  });
  
  const { data: dashboardMetrics } = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: () => getDashboardMetrics(),
  });

  useEffect(() => {
    if (courses) {
      setTotalCourses(courses.length);
    }
    if (instructors) {
      setTotalInstructors(instructors.length);
    }
    if (students) {
      setTotalStudents(students.length);
    }
    if (dashboardMetrics) {
      setMetrics(dashboardMetrics);
    }
  }, [courses, instructors, students, dashboardMetrics]);

  return (
    <Layout>
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Track key metrics and get an overview of your platform.
          </p>
        </div>
        <BookOpen className="h-6 w-6" />
      </div>
      <Tabs defaultValue="metrics" className="mt-6">
        <TabsList>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="settings" disabled>Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalStudents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Instructors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInstructors}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCourses}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$24,570</div>
              </CardContent>
            </Card>
          </div>

          {metrics && <DashboardMetrics stats={metrics} />}
        </TabsContent>
        <TabsContent value="reports">
          <div>Reports Content</div>
        </TabsContent>
        <TabsContent value="settings">
          <div>Settings Content</div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Dashboard;
