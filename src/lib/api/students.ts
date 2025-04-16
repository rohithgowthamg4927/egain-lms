
import { apiFetch } from './core';
import { Course, CourseReview, Schedule } from '@/lib/types';

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
export const getStudentSchedules = async (studentId: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  try {
    // Use the apiFetch function which properly handles authentication tokens
    const response = await apiFetch<Schedule[]>(`/students/${studentId}/schedules`);
    return response;
  } catch (error) {
    console.error("getStudentSchedules error:", error);
    return {
      success: false,
      data: [], // Return empty array as fallback
      error: error instanceof Error ? error.message : 'Failed to fetch student schedules'
    };
  }
};

// Get student batch enrollments
export const getStudentBatches = async (studentId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    // Use the apiFetch function which properly handles authentication tokens
    const response = await apiFetch<any[]>(`/student-batches/${studentId}`);
    return response;
  } catch (error) {
    console.error("getStudentBatches error:", error);
    return {
      success: false,
      data: [], // Return empty array as fallback
      error: error instanceof Error ? error.message : 'Failed to fetch student batches'
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

// Get attendance history for a student
export const getStudentAttendanceHistory = async (studentId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    // Updated to use the attendance/history endpoint with the student's batches
    const studentBatches = await getStudentBatches(studentId);
    
    if (!studentBatches.success || !studentBatches.data || !Array.isArray(studentBatches.data) || studentBatches.data.length === 0) {
      return { success: true, data: [] };
    }
    
    // Get the first batch ID for the student (assuming we want to start with this)
    const batchId = studentBatches.data[0].batch.batchId;
    
    // Use the attendance history endpoint which is the same one used by admin/instructors
    const response = await apiFetch<any[]>(`/attendance/history/${batchId}`);
    
    // Filter the response to only include the current student's records if needed
    if (response.success && Array.isArray(response.data)) {
      // Filter the data to only include records for this student
      const filteredData = response.data.filter(record => record.user.userId === studentId);
      return { ...response, data: filteredData };
    }
    
    return response;
  } catch (error) {
    console.error("getStudentAttendanceHistory error:", error);
    return {
      success: false,
      data: [], // Return empty array as fallback
      error: error instanceof Error ? error.message : 'Failed to fetch student attendance history'
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
