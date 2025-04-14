import { apiFetch } from './core';
import { Course, CourseReview } from '@/lib/types';

// Get student's course details
export const getStudentCourseDetail = async (courseId: string): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await apiFetch(`/courses/${courseId}`);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch course details'
    };
  }
};

// Get all courses for a student
export const getStudentCourses = async (studentId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const response = await apiFetch<any[]>(`/student-courses/${studentId}`);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch student courses'
    };
  }
};

// Get all schedules for a student
export const getStudentSchedules = async (studentId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const response = await apiFetch<any[]>(`/students/${studentId}/schedules`);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch student schedules'
    };
  }
};

// Get all resources for a student
export const getStudentResources = async (studentId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const response = await apiFetch<any[]>(`/students/${studentId}/resources`);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch student resources'
    };
  }
};

// Submit a course review
export const submitCourseReview = async (
  studentId: number,
  courseId: number,
  rating: number,
  review?: string
): Promise<{ success: boolean; data?: CourseReview; error?: string }> => {
  try {
    const response = await apiFetch<CourseReview>(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        userId: studentId,
        rating,
        review
      })
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit course review'
    };
  }
};

// Update a course review
export const updateCourseReview = async (
  studentId: number,
  courseId: number,
  reviewId: number,
  rating: number,
  review?: string
): Promise<{ success: boolean; data?: CourseReview; error?: string }> => {
  try {
    const response = await apiFetch<CourseReview>(`/courses/${courseId}/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify({
        userId: studentId,
        rating,
        review
      })
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update course review'
    };
  }
};

// Delete a course review
export const deleteCourseReview = async (
  studentId: number,
  courseId: number,
  reviewId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/courses/${courseId}/reviews/${reviewId}`, {
      method: 'DELETE',
      body: JSON.stringify({
        userId: studentId
      })
    });
    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete course review'
    };
  }
};
