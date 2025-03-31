
import { Batch } from '@/lib/types';
import { apiFetch } from './core';

// Get all batches with optional filtering by courseId
export const getBatches = async (courseId?: number): Promise<{ success: boolean; data?: Batch[]; error?: string }> => {
  const endpoint = courseId ? `/batches?courseId=${courseId}` : '/batches';
  return apiFetch<Batch[]>(endpoint);
};

// Get a specific batch by ID
export const getBatchById = async (batchId: number): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  return apiFetch<Batch>(`/batches/${batchId}`);
};

// Create a new batch
export const createBatch = async (batchData: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  return apiFetch<Batch>('/batches', {
    method: 'POST',
    body: JSON.stringify({
      name: batchData.batchName,
      startDate: batchData.startDate,
      endDate: batchData.endDate,
      courseId: batchData.courseId,
      instructorId: batchData.instructorId
    }),
  });
};

// Update an existing batch
export const updateBatch = async (batchId: number, batchData: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  return apiFetch<Batch>(`/batches/${batchId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: batchData.batchName,
      startDate: batchData.startDate,
      endDate: batchData.endDate,
      courseId: batchData.courseId,
      instructorId: batchData.instructorId
    }),
  });
};

// Delete a batch
export const deleteBatch = async (batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/batches/${batchId}`, {
    method: 'DELETE',
  });
};

// Student Batch Management
export const enrollStudentToBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch('/batches/' + batchId + '/students', {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  });
};

export const unenrollStudentFromBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/batches/${batchId}/students/${studentId}`, {
    method: 'DELETE',
  });
};

// Get students for a specific batch
export const getBatchStudents = async (batchId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  return apiFetch(`/batches/${batchId}/students`);
};

// Get students NOT in a specific batch (for enrollment)
export const getStudentsNotInBatch = async (batchId: number): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  return apiFetch(`/batches/${batchId}/available-students`);
};
