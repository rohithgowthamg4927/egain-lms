
import { DashboardMetrics } from '@/lib/types';
import { apiFetch } from './core';

// Dashboard metrics
export const getDashboardMetrics = async (): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> => {
  try {
    const response = await apiFetch<DashboardMetrics>('/dashboard-metrics');
    
    // Add courses by category - temporary transformation if API doesn't provide it
    if (response.success && response.data && !response.data.coursesByCategory) {
      // Create coursesByCategory from the available data if API doesn't provide it directly
      const categoryCounts = new Map();
      const courses = response.data.popularCourses || [];
      
      courses.forEach(course => {
        if (course.course.category) {
          const categoryName = course.course.category.name;
          if (categoryCounts.has(categoryName)) {
            categoryCounts.set(categoryName, categoryCounts.get(categoryName) + 1);
          } else {
            categoryCounts.set(categoryName, 1);
          }
        }
      });
      
      response.data.coursesByCategory = Array.from(categoryCounts.entries()).map(([name, courseCount]) => ({
        name,
        courseCount
      }));
    }
    
    return response;
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard metrics' 
    };
  }
};
