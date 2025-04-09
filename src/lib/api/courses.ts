
import { Course } from '@/lib/types';
import { apiFetch } from './core';

// Courses API
export const getCourses = async (): Promise<{ success: boolean; data?: Course[]; error?: string }> => {
  try {
    console.log('Fetching courses...');
    const response = await apiFetch<Course[]>('/courses');
    console.log('Courses API Response:', response);
    return response;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Fetch a single course by ID
export const getCourseById = async (courseId: number): Promise<{ success: boolean; data?: Course; error?: string }> => {
  try {
    console.log(`Fetching course ${courseId}...`);
    const response = await apiFetch<Course>(`/courses/${courseId}`);
    console.log('Course API Response:', response);
    return response;
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error);
    throw error;
  }
};

// Course creation API
export const createCourse = async (courseData: Partial<Course>): Promise<{ success: boolean; data?: Course; error?: string }> => {
  console.log("Creating course with data:", courseData);
  
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
  console.log(`Updating course ${courseId} with data:`, courseData);
  
  // Ensure proper type conversion for categoryId
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
  console.log(`Deleting course ${courseId}`);
  return apiFetch(`/courses/${courseId}`, {
    method: 'DELETE',
  });
};
