
import { apiFetch } from './core';
import { StudentCourse, Schedule } from '@/lib/types';

// Get courses for a student
export const getStudentCourses = async (studentId: number): Promise<{ success: boolean; data?: StudentCourse[]; error?: string }> => {
  try {
    const response = await apiFetch<StudentCourse[]>(`/student-courses/${studentId}`);
    return response;
  } catch (error) {
    console.error('Error fetching student courses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch student courses'
    };
  }
};

// Get schedules for a student
export const getStudentSchedules = async (studentId: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  try {
    const response = await apiFetch<Schedule[]>(`/students/${studentId}/schedules`);
    return response;
  } catch (error) {
    console.error('Error fetching student schedules:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch student schedules'
    };
  }
};
