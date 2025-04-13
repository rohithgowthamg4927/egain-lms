
import { Course } from '@/lib/types';
import { apiFetch } from './core';

// Courses API
export const getCourses = async (): Promise<{ success: boolean; data?: Course[]; error?: string }> => {
  try {
    const response = await apiFetch<Course[]>('/courses');
    return response;
  } catch (error) {
    throw error;
  }
};

// Fetch a single course by ID
export const getCourseById = async (courseId: number): Promise<{ success: boolean; data?: Course; error?: string }> => {
  try {
    const response = await apiFetch<Course>(`/courses/${courseId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Course creation API
export const createCourse = async (courseData: Partial<Course>): Promise<{ success: boolean; data?: Course; error?: string }> => {

  return apiFetch<Course>('/courses', {
    method: 'POST',
    body: JSON.stringify({
      courseName: courseData.courseName,
      categoryId: courseData.categoryId ? Number(courseData.categoryId) : undefined,
      courseLevel: courseData.courseLevel,
      description: courseData.description,
      isPublished: courseData.isPublished !== undefined ? courseData.isPublished : true,
      thumbnailUrl: courseData.thumbnailUrl
    }),
  });
};

// Course update API
export const updateCourse = async (courseId: number, courseData: Partial<Course>): Promise<{ success: boolean; data?: Course; error?: string }> => {
  const formattedData = {
    ...courseData,
    categoryId: courseData.categoryId ? Number(courseData.categoryId) : undefined
  };
  
  return apiFetch<Course>(`/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(formattedData),
  });
};

// Course deletion API
export const deleteCourse = async (courseId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/courses/${courseId}`, {
    method: 'DELETE',
  });
};
