
import { Resource } from '@/lib/types';
import { apiFetch } from './core';

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
