
// Enums
export enum Role {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  STUDENT = 'STUDENT'
}

export enum Level {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

// Interfaces
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  photoUrl?: string;
  phone?: string;
  bio?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Course {
  id: number;
  courseName: string;
  description?: string;
  courseLevel: Level;
  categoryId: number;
  thumbnailUrl?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt?: Date;
  students?: number;
  batches?: number;
  averageRating?: number;
  durationHours?: number;
  // Added for compatibility with components
  category?: CourseCategory;
}

export interface CourseCategory {
  id: number;
  categoryName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Batch {
  id: number;
  batchName: string;
  courseId: number;
  instructorId: number;
  startDate: Date;
  endDate: Date;
  students?: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Added for compatibility with components
  course?: Course;
  instructor?: User;
  studentsCount?: number;
}

export interface Schedule {
  id: number;
  batchId: number;
  startTime: Date;
  endTime: Date;
  topic?: string;
  platform: string;
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Resource {
  id: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  courseId: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface StudentCourse {
  id: number;
  studentId: number;
  courseId: number;
  enrolledAt: Date;
  status: string;
}

export interface StudentBatch {
  id: number;
  studentId: number;
  batchId: number;
  enrolledAt: Date;
  status: string;
}

export interface CourseReview {
  id: number;
  studentId: number;
  courseId: number;
  rating: number;
  review?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface DashboardMetrics {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalBatches: number;
  activeStudents: number;
  coursesPerCategory: {
    categoryName: string;
    count: number;
  }[];
  recentEnrollments: {
    studentName: string;
    courseName: string;
    date: Date;
  }[];
}
