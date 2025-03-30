
import { apiFetch } from './core';

// Student Course Management
export const enrollStudentToCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch('/student-courses', {
    method: 'POST',
    body: JSON.stringify({ studentId, courseId }),
  });
};

export const unenrollStudentFromCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/student-courses/${studentId}/${courseId}`, {
    method: 'DELETE',
  });
};
