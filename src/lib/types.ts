
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
  isFirstLogin?: boolean;
  password?: string; // For demonstration purposes only - never store passwords in client-side code
  address?: string;
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
  instructors?: number[];
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
  recordingUrl?: string;
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
  student?: User;
  course?: Course;
}

export interface StudentBatch {
  id: number;
  studentId: number;
  batchId: number;
  enrolledAt: Date;
  status: string;
  student?: User;
  batch?: Batch;
}

export interface CourseReview {
  id: number;
  studentId: number;
  courseId: number;
  rating: number;
  review?: string;
  createdAt: Date;
  updatedAt?: Date;
  student?: User;
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

export interface ClassRecording {
  id: number;
  scheduleId: number;
  title: string;
  description?: string;
  recordingUrl: string;
  uploadedBy: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdAt: Date;
}
