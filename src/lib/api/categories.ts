
import { Category } from '@/lib/types';
import { apiFetch } from './core';

interface CategoryData {
  categoryName: string;
  description?: string | null;
}

// Get all categories
export const getCategories = async (): Promise<{ success: boolean; data?: Category[]; error?: string }> => {
  try {
    const response = await apiFetch<Category[]>('/categories');
    return response;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch categories'
    };
  }
};

// Get a category by ID
export const getCategory = async (categoryId: number): Promise<{ success: boolean; data?: Category; error?: string }> => {
  try {
    const response = await apiFetch<Category>(`/categories/${categoryId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching category ${categoryId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch category'
    };
  }
};

// Create a new category
export const createCategory = async (data: Partial<CategoryData>): Promise<{ success: boolean; data?: Category; error?: string }> => {
  try {
    const categoryData: CategoryData = {
      categoryName: data.categoryName || '',
      description: data.description || null
    };
    
    const response = await apiFetch<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
    return response;
  } catch (error) {
    console.error('Error creating category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category'
    };
  }
};

// Update a category
export const updateCategory = async (categoryId: number, data: Partial<CategoryData>): Promise<{ success: boolean; data?: Category; error?: string }> => {
  try {
    const categoryData: CategoryData = {
      categoryName: data.categoryName || '',
      description: data.description || null
    };
    
    const response = await apiFetch<Category>(`/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
    return response;
  } catch (error) {
    console.error(`Error updating category ${categoryId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update category'
    };
  }
};

// Delete a category
export const deleteCategory = async (categoryId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/categories/${categoryId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error(`Error deleting category ${categoryId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete category'
    };
  }
};
