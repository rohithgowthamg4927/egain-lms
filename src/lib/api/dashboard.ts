
import { DashboardMetrics } from '@/lib/types';
import { apiFetch } from './core';

// Dashboard metrics
export const getDashboardMetrics = async (): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> => {
  try {
    const response = await apiFetch<DashboardMetrics>('/dashboard');
    
    // Log the response for debugging
    console.log("Dashboard metrics response:", response);
    
    return response;
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard metrics' 
    };
  }
};

// Get just counts for courses and students
export const getDashboardCounts = async (): Promise<{ 
  success: boolean; 
  data?: { coursesCount: number; studentsCount: number }; 
  error?: string 
}> => {
  try {
    const response = await apiFetch<{ coursesCount: number; studentsCount: number }>('/dashboard/counts');
    return response;
  } catch (error) {
    console.error("Error fetching dashboard counts:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch counts' 
    };
  }
};
