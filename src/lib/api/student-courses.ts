
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
      data: [], // Return empty array instead of undefined
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

// Add a review to a course
export const addCourseReview = async (courseId: number, userId: number, rating: number, comment: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ userId, rating, comment })
    });
    return response;
  } catch (error) {
    console.error('Error adding course review:', error);
    return {
      success: false,
      data: [], // Return empty array instead of undefined
      error: error instanceof Error ? error.message : 'Failed to add course review'
    };
  }
};

// Get existing reviews for a course
export const getCourseReviews = async (courseId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const response = await apiFetch<any[]>(`/courses/${courseId}/reviews`);
    return response;
  } catch (error) {
    console.error('Error fetching course reviews:', error);
    return {
      success: false,
      data: [], // Return empty array instead of undefined
      error: error instanceof Error ? error.message : 'Failed to fetch course reviews'
    };
  }
};
