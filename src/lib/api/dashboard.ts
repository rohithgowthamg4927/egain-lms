
import { DashboardMetrics } from '@/lib/types';
import { apiFetch } from './core';

// Dashboard metrics
export const getDashboardMetrics = async (): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> => {
  try {
    const response = await apiFetch<DashboardMetrics>('/dashboard-metrics');
    return response;
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard metrics' 
    };
  }
};
