
import { Course } from '@/lib/types';
import { apiFetch } from './core';

// Courses API
export const getCourses = async (): Promise<{ success: boolean; data?: Course[]; error?: string }> => {
  return apiFetch<Course[]>('/courses');
};

// Fetch a single course by ID
export const getCourseById = async (courseId: number): Promise<{ success: boolean; data?: Course; error?: string }> => {
  return apiFetch<Course>(`/courses/${courseId}`);
};

// Course creation API
export const createCourse = async (courseData: Partial<Course>): Promise<{ success: boolean; data?: Course; error?: string }> => {
  console.log("Creating course with data:", courseData);
  return apiFetch<Course>('/courses', {
    method: 'POST',
    body: JSON.stringify({
      courseName: courseData.courseName,
      categoryId: courseData.categoryId,
      courseLevel: courseData.courseLevel,
      description: courseData.description,
      isPublished: courseData.isPublished !== undefined ? courseData.isPublished : true,
      duration: courseData.duration,
      thumbnailUrl: courseData.thumbnailUrl
    }),
  });
};
