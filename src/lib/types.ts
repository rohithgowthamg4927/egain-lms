
export enum Role {
  admin = 'admin',
  instructor = 'instructor',
  student = 'student'
}

export enum Level {
  beginner = 'beginner',
  intermediate = 'intermediate',
  advanced = 'advanced'
}

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  mustResetPassword: boolean;
  profilePicture?: ProfilePicture;
}

export interface ProfilePicture {
  pictureId: number;
  userId: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  courseId: number;
  courseName: string;
  courseLevel: Level;
  categoryId: number;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  category?: CourseCategory;
}

export interface CourseCategory {
  categoryId: number;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  batchId: number;
  batchName: string;
  courseId: number;
  instructorId: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  course?: Course;
  instructor?: User;
}

export interface Schedule {
  scheduleId: number;
  batchId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  resourceId: number;
  courseId: number;
  title: string;
  type: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseReview {
  reviewId: number;
  courseId: number;
  userId: number;
  rating: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalBatches: number;
  recentUsers: User[];
  upcomingBatches: Batch[];
}

export interface UserFormData {
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  password?: string;
  bio?: string;
  photoUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: Role;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
