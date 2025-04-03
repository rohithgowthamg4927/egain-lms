
import { Course } from '@/lib/types';
import { apiFetch } from './core';

// Get courses for a student
export const getStudentCourses = async (studentId: number): Promise<{ success: boolean; data?: Course[]; error?: string }> => {
  return apiFetch<Course[]>(`/students/${studentId}/courses`);
};

// Enroll a student in a course
export const enrollStudentInCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch('/students/courses', {
    method: 'POST',
    body: JSON.stringify({ studentId, courseId }),
  });
};

// Unenroll a student from a course
export const unenrollStudentFromCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/students/${studentId}/courses/${courseId}`, {
    method: 'DELETE',
  });
};
