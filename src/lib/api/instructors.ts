
import { apiFetch } from './core';
import { Course, Schedule, Resource } from '@/lib/types';

// Get courses taught by an instructor
export const getInstructorCourses = async (instructorId: number): Promise<{ success: boolean; data?: Course[]; error?: string }> => {
  try {
    const response = await apiFetch<Course[]>(`/instructors/${instructorId}/courses`);
    return response;
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch instructor courses'
    };
  }
};

// Get schedules for an instructor
export const getInstructorSchedules = async (instructorId: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  try {
    const response = await apiFetch<Schedule[]>(`/instructors/${instructorId}/schedules`);
    return response;
  } catch (error) {
    console.error('Error fetching instructor schedules:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch instructor schedules'
    };
  }
};

// Get resources for an instructor's batches
export const getInstructorResources = async (instructorId: number): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  try {
    const response = await apiFetch<Resource[]>(`/instructors/${instructorId}/resources`);
    return response;
  } catch (error) {
    console.error('Error fetching instructor resources:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch instructor resources'
    };
  }
};

// Get batches assigned to an instructor
export const getInstructorBatches = async (instructorId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const response = await apiFetch<any[]>(`/instructors/${instructorId}/batches`);
    return response;
  } catch (error) {
    console.error('Error fetching instructor batches:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch instructor batches'
    };
  }
};
