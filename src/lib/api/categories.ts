
import { CourseCategory } from '@/lib/types';
import { apiFetch } from './core';

// Course Categories API
export const getCategories = async (): Promise<{ success: boolean; data?: CourseCategory[]; error?: string }> => {
  return apiFetch<CourseCategory[]>('/categories');
};

export const createCategory = async (categoryData: Partial<CourseCategory>): Promise<{ success: boolean; data?: CourseCategory; error?: string }> => {
  return apiFetch<CourseCategory>('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
};
