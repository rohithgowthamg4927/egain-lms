
import { Course, User, Category, Batch, Schedule, Resource } from '@/lib/types';
import { dateToString } from './utils/date-helpers';

/**
 * Converts a Date property to string in an object
 */
export function convertDatesToStrings<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj } as any;
  
  for (const key in result) {
    if (result[key] instanceof Date) {
      result[key] = dateToString(result[key] as Date);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = convertDatesToStrings(result[key]);
    }
  }
  
  return result as T;
}

/**
 * Ensures the entity has both id and entityId properties
 * For example: courseId and id for Course
 */
export function ensureIdProperties<T extends { [key: string]: any }>(entity: T, entityType: string): T {
  const result = { ...entity } as any;
  const idPropName = `${entityType}Id`;
  
  // If we have an id but no entityId (courseId, batchId, etc.)
  if (result.id && !result[idPropName]) {
    result[idPropName] = result.id;
  }
  
  // If we have an entityId but no id
  if (!result.id && result[idPropName]) {
    result.id = result[idPropName];
  }
  
  return result as T;
}

/**
 * Maps API fields to match TypeScript interface
 */
export function mapApiCourse(course: any): Course {
  return {
    courseId: course.id || course.courseId,
    courseName: course.courseName,
    courseLevel: course.courseLevel,
    categoryId: course.categoryId,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    isPublished: course.isPublished ?? true,
    createdAt: dateToString(course.createdAt),
    updatedAt: dateToString(course.updatedAt || course.createdAt),
    category: course.category,
    students: course.students || 0,
    batches: course.batches || 0,
    averageRating: course.averageRating || 0,
    createdBy: course.createdBy
  };
}

export function mapApiUser(user: any): User {
  return {
    userId: user.id || user.userId,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber || user.phone,
    role: user.role,
    createdAt: dateToString(user.createdAt),
    updatedAt: dateToString(user.updatedAt || user.createdAt),
    mustResetPassword: user.mustResetPassword || user.isFirstLogin || false,
    profilePicture: user.profilePicture,
    photoUrl: user.photoUrl || user.profilePicture?.fileUrl,
    bio: user.bio
  };
}

export function mapApiCategory(category: any): Category {
  return {
    categoryId: category.id || category.categoryId,
    categoryName: category.categoryName,
    description: category.description,
    createdAt: dateToString(category.createdAt || new Date()),
    updatedAt: dateToString(category.updatedAt || category.createdAt || new Date())
  };
}

export function mapApiBatch(batch: any): Batch {
  return {
    batchId: batch.id || batch.batchId,
    batchName: batch.batchName,
    courseId: batch.courseId,
    instructorId: batch.instructorId,
    startDate: dateToString(batch.startDate),
    endDate: dateToString(batch.endDate),
    createdAt: dateToString(batch.createdAt || new Date()),
    updatedAt: dateToString(batch.updatedAt || batch.createdAt || new Date()),
    course: batch.course ? mapApiCourse(batch.course) : undefined,
    instructor: batch.instructor ? mapApiUser(batch.instructor) : undefined,
    students: batch.students || 0,
    studentsCount: batch.studentsCount || batch.students || 0
  };
}
