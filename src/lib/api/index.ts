
// Remove any import or export related to attendance.service

// Re-export attendance-related functions directly from the existing implementation
export * from './core';
export * from './auth';
export * from './users';
export * from './courses';
export * from './categories';
export * from './batches';
export * from './resources';
export * from './schedules';
export * from './student-courses';
export * from './dashboard';
export * from './instructors';
export * from './students';

// Re-export getUser from users.ts for backward compatibility
export { getUser, updateUser, deleteUser, regenerateUserPassword } from './users';

// Make sure we export unenrollStudentFromBatch for backward compatibility
export { 
  getBatches, 
  getBatch, 
  getBatchStudents, 
  createBatch, 
  updateBatch, 
  deleteBatch, 
  enrollStudentInBatch, 
  unenrollStudentFromBatch as removeStudentFromBatch 
} from './batches';

// Re-export student course functions
export {
  getStudentCourses,
  enrollStudentInCourse,
  removeStudentFromCourse
} from './student-courses';

// Re-export instructor functions
export {
  getInstructorCourses,
  getInstructorSchedules,
  getInstructorBatches
} from './instructors';

// Re-export student-specific functions
export {
  getStudentSchedules,
  getStudentBatches,
  getStudentResources,
  getStudentCourseDetail,
  getStudentAttendanceHistory,
  submitCourseReview,
  updateCourseReview,
  deleteCourseReview
} from './students';
