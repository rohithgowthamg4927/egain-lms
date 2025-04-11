
import { apiFetch } from './core';

// Get a student's enrolled batches
export const getStudentBatches = async (studentId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const response = await apiFetch<any[]>(`/student-batches/${studentId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching batches for student ${studentId}:`, error);
    return {
      success: false,
      data: [], // Return empty array instead of undefined
      error: error instanceof Error ? error.message : 'Failed to fetch student batches'
    };
  }
};

// Get a student's courses
export const getStudentCourses = async (studentId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const response = await apiFetch<any[]>(`/student-courses/${studentId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching courses for student ${studentId}:`, error);
    return {
      success: false,
      data: [], // Return empty array instead of undefined
      error: error instanceof Error ? error.message : 'Failed to fetch student courses'
    };
  }
};

// Get a student's schedules
export const getStudentSchedules = async (studentId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const response = await apiFetch<any[]>(`/students/${studentId}/schedules`);
    return response;
  } catch (error) {
    console.error(`Error fetching schedules for student ${studentId}:`, error);
    return {
      success: false,
      data: [], // Return empty array instead of undefined
      error: error instanceof Error ? error.message : 'Failed to fetch student schedules'
    };
  }
};
