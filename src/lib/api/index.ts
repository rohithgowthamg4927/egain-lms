
// Re-export all API modules
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

// Re-export getUser from users.ts for backward compatibility
export { getUser, updateUser } from './users';
