
export enum Role {
  ADMIN = "ADMIN",
  INSTRUCTOR = "INSTRUCTOR",
  STUDENT = "STUDENT"
}

export enum Level {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED"
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  photoUrl?: string;
  bio?: string;
  isFirstLogin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseCategory {
  id: number;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: number;
  courseName: string;
  description?: string;
  courseLevel: Level;
  categoryId: number;
  category?: CourseCategory;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  instructors?: User[];
  students?: number; // Count of enrolled students
  batches?: number; // Count of batches
  resources?: number; // Count of resources
  averageRating?: number;
}

export interface Batch {
  id: number;
  batchName: string;
  courseId: number;
  instructorId: number;
  startDate: string;
  endDate: string;
  course?: Course;
  instructor?: User;
  studentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentBatch {
  id: number;
  studentId: number;
  batchId: number;
  status: string;
  enrolledAt: string;
  student?: User;
  batch?: Batch;
}

export interface StudentCourse {
  id: number;
  studentId: number;
  courseId: number;
  status: string;
  enrolledAt: string;
  student?: User;
  course?: Course;
}

export interface Schedule {
  id: number;
  batchId: number;
  topic?: string;
  startTime: string;
  endTime: string;
  platform: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseReview {
  id: number;
  studentId: number;
  courseId: number;
  rating: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
  student?: User;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalBatches: number;
  recentCourses: Course[];
  upcomingBatches: Batch[];
  studentsDemographics?: Record<string, number>;
  popularCourses?: {
    courseName: string;
    enrollments: number;
  }[];
}
