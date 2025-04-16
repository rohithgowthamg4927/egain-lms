
import { useQuery } from '@tanstack/react-query';
import { getDashboardMetrics } from '@/lib/api/dashboard';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { useAuth } from '@/hooks/use-auth';

const Dashboard = () => {

  // Fetch dashboard metrics
  const metricsQuery = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: getDashboardMetrics
  });

  const isLoading = metricsQuery.isLoading;
  const isError = metricsQuery.isError;
  const dashboardData = metricsQuery.data?.data;

  return (
    <div className="space-y-6 w-full">
      <BreadcrumbNav items={[
        { label: 'Dashboard', link: '/dashboard' }
      ]} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <DashboardMetrics 
        data={dashboardData} 
        isLoading={isLoading} 
        isError={isError} 
      />
    </div>
  );
};

export default Dashboard;
