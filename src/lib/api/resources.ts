
import { Resource } from '@/lib/types';
import { apiFetch } from './core';

// Get all resources for a batch
export const getResourcesByBatch = async (batchId: string): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  return apiFetch<Resource[]>(`/resources/batch/${batchId}`);
};

// Resources API
export const getResources = async (courseId?: number): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  const endpoint = courseId ? `/resources?courseId=${courseId}` : '/resources';
  return apiFetch<Resource[]>(endpoint);
};

export const createResource = async (resourceData: Partial<Resource>): Promise<{ success: boolean; data?: Resource; error?: string }> => {
  return apiFetch<Resource>('/resources', {
    method: 'POST',
    body: JSON.stringify(resourceData),
  });
};

// Enhanced delete resource function that ensures S3 deletion
export const deleteResource = async (resourceId: number): Promise<{ success: boolean; error?: string }> => {
  console.log(`Deleting resource with ID: ${resourceId}`);
  return apiFetch(`/resources/${resourceId}`, {
    method: 'DELETE',
  });
};

// Get a presigned URL for a resource
export const getResourcePresignedUrl = async (resourceId: number): Promise<{ success: boolean; data?: { presignedUrl: string }; error?: string }> => {
  return apiFetch<{ presignedUrl: string }>(`/resources/${resourceId}`);
};
