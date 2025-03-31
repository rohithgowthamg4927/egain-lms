import { Course, User, CourseCategory, Batch, Schedule, Resource } from '@/lib/types';
import { dateToString } from '../utils/date-helpers';

/**
 * A generic adapter to convert between API and application entities
 */
export class EntityAdapter {
  static adaptCourse(apiCourse: any): Course {
    return {
      courseId: apiCourse.id || apiCourse.courseId,
      id: apiCourse.id || apiCourse.courseId,
      courseName: apiCourse.courseName,
      courseLevel: apiCourse.courseLevel,
      categoryId: apiCourse.categoryId,
      description: apiCourse.description,
      thumbnailUrl: apiCourse.thumbnailUrl,
      isPublished: apiCourse.isPublished || false,
      createdAt: dateToString(apiCourse.createdAt),
      updatedAt: dateToString(apiCourse.updatedAt),
      category: apiCourse.category ? this.adaptCategory(apiCourse.category) : undefined,
      students: apiCourse.students || 0,
      batches: apiCourse.batches || 0,
      averageRating: apiCourse.averageRating || 0,
      createdBy: apiCourse.createdBy
    };
  }

  static adaptUser(apiUser: any): User {
    return {
      userId: apiUser.id || apiUser.userId,
      fullName: apiUser.fullName,
      email: apiUser.email,
      phoneNumber: apiUser.phoneNumber || apiUser.phone,
      role: apiUser.role,
      createdAt: dateToString(apiUser.createdAt),
      updatedAt: dateToString(apiUser.updatedAt),
      mustResetPassword: apiUser.mustResetPassword || apiUser.isFirstLogin || false,
      profilePicture: apiUser.profilePicture,
      photoUrl: apiUser.photoUrl || (apiUser.profilePicture ? apiUser.profilePicture.fileUrl : undefined),
      bio: apiUser.bio
    };
  }

  static adaptCategory(apiCategory: any): CourseCategory {
    return {
      categoryId: apiCategory.id || apiCategory.categoryId,
      id: apiCategory.id || apiCategory.categoryId,
      categoryName: apiCategory.categoryName,
      createdAt: dateToString(apiCategory.createdAt),
      updatedAt: dateToString(apiCategory.updatedAt)
    };
  }

  static adaptBatch(apiBatch: any): Batch {
    return {
      batchId: apiBatch.id || apiBatch.batchId,
      id: apiBatch.id || apiBatch.batchId,
      batchName: apiBatch.batchName,
      courseId: apiBatch.courseId,
      instructorId: apiBatch.instructorId,
      startDate: dateToString(apiBatch.startDate),
      endDate: dateToString(apiBatch.endDate),
      createdAt: dateToString(apiBatch.createdAt),
      updatedAt: dateToString(apiBatch.updatedAt),
      course: apiBatch.course ? this.adaptCourse(apiBatch.course) : undefined,
      instructor: apiBatch.instructor ? this.adaptUser(apiBatch.instructor) : undefined,
      students: apiBatch.students || 0,
      studentsCount: apiBatch.studentsCount || apiBatch.students || 0
    };
  }

  static adaptSchedule(apiSchedule: any): Schedule {
    return {
      scheduleId: apiSchedule.id || apiSchedule.scheduleId,
      batchId: apiSchedule.batchId,
      dayOfWeek: apiSchedule.dayOfWeek,
      startTime: dateToString(apiSchedule.startTime),
      endTime: dateToString(apiSchedule.endTime),
      createdAt: dateToString(apiSchedule.createdAt),
      updatedAt: dateToString(apiSchedule.updatedAt),
      topic: apiSchedule.topic,
      platform: apiSchedule.platform,
      link: apiSchedule.link
    };
  }
}
