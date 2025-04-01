
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import { getDashboardMetrics } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@/lib/types';

const Dashboard = () => {
  const { hasRole } = useAuth();

  // Fetch dashboard metrics
  const dashboardMetricsQuery = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: getDashboardMetrics,
  });

  useEffect(() => {
    if (dashboardMetricsQuery.isError) {
      console.error('Error fetching dashboard metrics:', dashboardMetricsQuery.error);
    }
  }, [dashboardMetricsQuery.isError, dashboardMetricsQuery.error]);

  return (
    <Layout noHeader={true}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
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
    </Layout>
  );
};

export default Dashboard;
