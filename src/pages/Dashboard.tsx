import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { getDashboardMetrics } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();

  // Fetch dashboard metrics with retry logic
  const dashboardMetricsQuery = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: getDashboardMetrics,
    retry: 5, // Increased retries to handle potential network issues
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (dashboardMetricsQuery.isError) {
      console.error('Error fetching dashboard metrics:', dashboardMetricsQuery.error);
      toast({
        title: 'Error loading dashboard data',
        description: 'Could not load dashboard metrics. Please try again later.',
        variant: 'destructive'
      });
    }
  }, [dashboardMetricsQuery.isError, dashboardMetricsQuery.error, toast]);

  // Log the received data for debugging
  useEffect(() => {
    if (dashboardMetricsQuery.data) {
      console.log("Received API data:", JSON.stringify(dashboardMetricsQuery.data, null, 2));
    }
  }, [dashboardMetricsQuery.data]);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. Here's an overview of your learning management system.
        </p>
      </div>

      <DashboardMetrics 
        data={dashboardMetricsQuery.data?.data}
        isLoading={dashboardMetricsQuery.isLoading}
        isError={dashboardMetricsQuery.isError}
      />
      
      {hasRole([Role.admin]) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Admin-specific dashboards can be added here */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
