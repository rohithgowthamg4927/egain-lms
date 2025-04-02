
import { Batch, User } from '@/lib/types';
import { apiFetch } from './core';

// Get all batches
export const getBatches = async (): Promise<{ success: boolean; data?: Batch[]; error?: string }> => {
  return apiFetch<Batch[]>('/batches');
};

// Get a single batch by ID
export const getBatch = async (batchId: number): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  return apiFetch<Batch>(`/batches/${batchId}`);
};

// Get all students enrolled in a batch
export const getBatchStudents = async (batchId: number): Promise<{ success: boolean; data?: User[]; error?: string }> => {
  return apiFetch<User[]>(`/batches/${batchId}/students`);
};

// Create a new batch
export const createBatch = async (batchData: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  return apiFetch<Batch>('/batches', {
    method: 'POST',
    body: JSON.stringify(batchData),
  });
};

// Update a batch
export const updateBatch = async (batchId: number, batchData: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  return apiFetch<Batch>(`/batches/${batchId}`, {
    method: 'PUT',
    body: JSON.stringify(batchData),
  });
};

// Delete a batch
export const deleteBatch = async (batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/batches/${batchId}`, {
    method: 'DELETE',
  });
};

// Enroll student in a batch
export const enrollStudentInBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch('/student-batches', {
    method: 'POST',
    body: JSON.stringify({ studentId, batchId }),
  });
};

// Unenroll student from a batch
export const unenrollStudentFromBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/student-batches/${studentId}/${batchId}`, {
    method: 'DELETE',
  });
};
