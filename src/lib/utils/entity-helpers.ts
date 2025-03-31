
import { Course, CourseCategory, User, Batch } from "../types";

// Helper function to get course name safely
export const getCourseName = (course: Course | undefined | null, courseId?: number): string => {
  if (course) {
    return course.courseName;
  }
  
  return courseId ? `Course ID: ${courseId}` : 'N/A';
};

// Helper function to get category name safely
export const getCategoryName = (course: Course, categories: CourseCategory[]): string => {
  const category = categories.find(cat => cat.id === course.categoryId);
  return category ? category.categoryName : 'N/A';
};

// Helper function to get instructor name safely
export const getInstructorName = (instructor: User | undefined | null, instructorId?: number): string => {
  if (instructor) {
    return instructor.fullName;
  }
  
  return instructorId ? `Instructor ID: ${instructorId}` : 'N/A';
};

// Helper function to get student count safely
export const getStudentCount = (batch: Batch): number => {
  return batch.studentsCount || batch.students || 0;
};
