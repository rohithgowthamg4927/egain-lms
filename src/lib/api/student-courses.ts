
import { StudentCourse } from '@/lib/types';
import { apiFetch } from './core';

// Get all courses for a student
export const getStudentCourses = async (studentId: number): Promise<{ success: boolean; data?: StudentCourse[]; error?: string }> => {
  try {
    const response = await apiFetch<StudentCourse[]>(`/student-courses/${studentId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching courses for student ${studentId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch student courses'
    };
  }
};

// Enroll student in a course
export const enrollStudentInCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; data?: StudentCourse; error?: string }> => {
  try {
    const response = await apiFetch<StudentCourse>('/student-courses', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId })
    });
    return response;
  } catch (error) {
    console.error('Error enrolling student in course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enroll student in course'
    };
  }
};

// Remove student from a course
export const removeStudentFromCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/student-courses/${studentId}/${courseId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Error removing student from course:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove student from course'
    };
  }
};
