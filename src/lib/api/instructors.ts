
import { apiFetch } from './core';
import { Course, Schedule, Batch } from '@/lib/types';

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

// Get batches assigned to an instructor
export const getInstructorBatches = async (instructorId: number): Promise<{ success: boolean; data?: Batch[]; error?: string }> => {
  try {
    const response = await apiFetch<Batch[]>(`/instructors/${instructorId}/batches`);
    return response;
  } catch (error) {
    console.error('Error fetching instructor batches:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch instructor batches'
    };
  }
};
