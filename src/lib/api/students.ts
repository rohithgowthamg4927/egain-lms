import { Schedule, Resource } from '../types';
import { apiFetch } from './core';

export interface StudentCourse {
  studentCourseId: number;
  studentId: number;
  courseId: number;
  createdAt: string;
  course: {
    courseId: number;
    courseName: string;
    description: string | null;
    categoryId: number | null;
    category: {
      categoryId: number;
      categoryName: string;
    } | null;
  };
}

export interface StudentSchedule {
  scheduleId: number;
  topic: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  batch: {
    batchId: number;
    batchName: string;
    course: {
      courseId: number;
      courseName: string;
    };
  };
}

export interface StudentResource {
  resourceId: number;
  title: string;
  description: string | null;
  fileUrl: string;
  resourceType: 'assignment' | 'recording';
  batch: {
    batchId: number;
    batchName: string;
    course: {
      courseId: number;
      courseName: string;
    };
  };
}

export interface StudentAssignment {
  assignmentId: number;
  title: string;
  description: string | null;
  dueDate: string;
  grade: number | null;
  isSubmitted: boolean;
  submissionUrl: string | null;
  resourceUrl: string;
  comments: string | null;
}

export interface StudentCourseDetail {
  courseId: number;
  courseName: string;
  description: string | null;
  categoryId: number | null;
  category: {
    categoryId: number;
    categoryName: string;
  } | null;
  assignments: StudentAssignment[];
  resources: StudentResource[];
  schedules: StudentSchedule[];
}

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

export const getStudentResources = async (studentId: number): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  try {
    const response = await apiFetch<{ success: boolean; data: Resource[] }>(`/students/${studentId}/resources`);
    if (response.success && response.data) {
      return response;
    }
    return { success: false, error: 'Failed to fetch resources' };
  } catch (error) {
    console.error('Error fetching student resources:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch resources' };
  }
};

export const submitCourseReview = async (
  studentId: number,
  courseId: number,
  rating: number,
  review: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch<{ success: boolean }>(
      `/courses/${courseId}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify({ userId: studentId, rating, comment: review }),
      }
    );
    return response;
  } catch (error) {
    console.error('Error submitting course review:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit course review'
    };
  }
};

export const getStudentCourseAssignments = async (courseId: string) => {
  const response = await apiFetch<StudentAssignment[]>(`/courses/${courseId}/assignments`);
  return response.data;
};

export const getStudentAssignment = async (courseId: string, assignmentId: string) => {
  const response = await apiFetch<StudentAssignment>(`/courses/${courseId}/assignments/${assignmentId}`);
  return response.data;
};

export const getStudentCourseDetail = async (courseId: string) => {
  const response = await apiFetch<StudentCourseDetail>(`/courses/${courseId}`);
  return response.data;
};
