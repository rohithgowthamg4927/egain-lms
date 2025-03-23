
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { DataTable } from '@/components/ui/data-table';
import { getDashboardStats, getCourses, getBatches } from '@/lib/api';
import { Course, Batch } from '@/lib/types';
import { Calendar, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [upcomingBatches, setUpcomingBatches] = useState<Batch[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      try {
        const statsResponse = await getDashboardStats();
        const coursesResponse = await getCourses();
        const batchesResponse = await getBatches();
        
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        }
        
        if (coursesResponse.success && coursesResponse.data) {
          setRecentCourses(coursesResponse.data.slice(0, 5));
        }
        
        if (batchesResponse.success && batchesResponse.data) {
          setUpcomingBatches(batchesResponse.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch dashboard data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const courseColumns = [
    {
      accessorKey: 'courseName' as keyof Course,
      header: 'Course Name',
    },
    {
      accessorKey: 'courseLevel' as keyof Course,
      header: 'Level',
      cell: (course: Course) => (
        <span className="capitalize">{course.courseLevel.toLowerCase()}</span>
      ),
    },
    {
      accessorKey: 'students' as keyof Course,
      header: 'Students',
    },
    {
      accessorKey: 'averageRating' as keyof Course,
      header: 'Rating',
      cell: (course: Course) => (
        <div className="flex items-center">
          <span className="text-amber-500 mr-1">★</span>
          {course.averageRating?.toFixed(1) || 'N/A'}
        </div>
      ),
    },
  ];

  const batchColumns = [
    {
      accessorKey: 'batchName' as keyof Batch,
      header: 'Batch Name',
    },
    {
      accessorKey: 'course' as keyof Batch,
      header: 'Course',
      cell: (batch: Batch) => batch.course?.courseName || 'N/A',
    },
    {
      accessorKey: 'startDate' as keyof Batch,
      header: 'Start Date',
      cell: (batch: Batch) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          {format(new Date(batch.startDate), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'instructor' as keyof Batch,
      header: 'Instructor',
      cell: (batch: Batch) => batch.instructor?.fullName || 'N/A',
    },
  ];

  const courseActions = [
    {
      label: 'View Course',
      onClick: (course: Course) => {
        window.location.href = `/courses/${course.id}`;
      },
      icon: <Eye className="h-4 w-4" />,
    },
  ];

  const batchActions = [
    {
      label: 'View Batch',
      onClick: (batch: Batch) => {
        window.location.href = `/batches/${batch.id}`;
      },
      icon: <Eye className="h-4 w-4" />,
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full h-[500px] flex items-center justify-center">
          <div className="lms-loader" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
        
        {stats && <DashboardMetrics stats={stats} />}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="neo-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Recent Courses</CardTitle>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/courses'}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={recentCourses} 
                columns={courseColumns}
                actions={courseActions}
                pagination={false}
              />
            </CardContent>
          </Card>
          
          <Card className="neo-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">Upcoming Batches</CardTitle>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/batches'}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={upcomingBatches} 
                columns={batchColumns}
                actions={batchActions}
                pagination={false}
              />
            </CardContent>
          </Card>
        </div>
        
        <Card className="neo-card mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">System Activity</CardTitle>
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Last 7 Days
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-3 border-b pb-3 last:border-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {getRandomIcon()}
                  </div>
                  <div>
                    <p className="font-medium">{getRandomActivity()}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date().setDate(new Date().getDate() - i), 'MMM d, yyyy')} at{' '}
                      {format(new Date().setHours(Math.floor(Math.random() * 24)), 'h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

// Helper functions to generate random activity for the demo
function getRandomIcon() {
  const icons = [
    <UserPlus key="userplus" className="h-4 w-4 text-primary" />,
    <BookOpen key="bookopen" className="h-4 w-4 text-primary" />,
    <Calendar key="calendar" className="h-4 w-4 text-primary" />,
    <User key="user" className="h-4 w-4 text-primary" />,
    <FileText key="filetext" className="h-4 w-4 text-primary" />,
  ];
  return icons[Math.floor(Math.random() * icons.length)];
}

function getRandomActivity() {
  const activities = [
    "New student enrolled to Python for Data Science course",
    "React Fundamentals course was updated",
    "New batch created for Advanced JavaScript",
    "Course review submitted by Alex Johnson",
    "Jane Smith uploaded new course resources",
    "Flutter for Beginners batch schedule updated",
    "New instructor account created",
  ];
  return activities[Math.floor(Math.random() * activities.length)];
}

// Support components for the dashboard
const FileText = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
};

const User = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
};

const UserPlus = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
};

export default Dashboard;
