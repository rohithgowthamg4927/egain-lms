
import { Batch } from '@/lib/types';
import { apiFetch } from './core';

// Batches API
export const getBatches = async (courseId?: number): Promise<{ success: boolean; data?: Batch[]; error?: string }> => {
  const endpoint = courseId ? `/batches?courseId=${courseId}` : '/batches';
  return apiFetch<Batch[]>(endpoint);
};

// Get a specific batch by ID
export const getBatchById = async (batchId: number): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  return apiFetch<Batch>(`/batches/${batchId}`);
};

export const createBatch = async (batchData: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  console.log("Creating batch with data:", batchData);
  return apiFetch<Batch>('/batches', {
    method: 'POST',
    body: JSON.stringify(batchData),
  });
};

// Student Batch Management
export const enrollStudentToBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch('/student-batches', {
    method: 'POST',
    body: JSON.stringify({ studentId, batchId }),
  });
};

export const unenrollStudentFromBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/student-batches/${studentId}/${batchId}`, {
    method: 'DELETE',
  });
};
