
import { CourseCategory } from '@/lib/types';
import { apiFetch } from './core';

// Course Categories API
export const getCategories = async (): Promise<{ success: boolean; data?: CourseCategory[]; error?: string }> => {
  return apiFetch<CourseCategory[]>('/categories');
};

export const getCategoryById = async (categoryId: number): Promise<{ success: boolean; data?: CourseCategory; error?: string }> => {
  return apiFetch<CourseCategory>(`/categories/${categoryId}`);
};

export const createCategory = async (categoryData: { categoryName: string }): Promise<{ success: boolean; data?: CourseCategory; error?: string }> => {
  console.log("Creating category with data:", categoryData);
  
  return apiFetch<CourseCategory>('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
};

export const updateCategory = async (categoryId: number, categoryData: { categoryName: string }): Promise<{ success: boolean; data?: CourseCategory; error?: string }> => {
  return apiFetch<CourseCategory>(`/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  });
};

export const deleteCategory = async (categoryId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/categories/${categoryId}`, {
    method: 'DELETE',
  });
};
