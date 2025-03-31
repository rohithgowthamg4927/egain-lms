
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
  id?: number; // Added for API compatibility
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  mustResetPassword: boolean;
  profilePicture?: ProfilePicture;
  // Additional fields needed by components
  photoUrl?: string;
  bio?: string;
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
  id?: number; // Added for API compatibility
  courseName: string;
  courseLevel: Level;
  categoryId: number;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
  price?: number; // Added price field
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  category?: CourseCategory;
  // Additional fields needed by components
  students?: number;
  batches?: number;
  averageRating?: number;
  durationHours?: number;
  createdBy?: number;
}

export interface CourseCategory {
  categoryId: number;
  id?: number; // Added for API compatibility
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  batchId: number;
  id?: number; // Added for API compatibility
  batchName: string;
  courseId: number;
  instructorId: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  course?: Course;
  instructor?: User;
  // Additional fields needed by components
  students?: number;
  studentsCount?: number;
}

export interface Schedule {
  scheduleId: number;
  id?: number; // Added for API compatibility
  batchId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  meetingLink?: string; // Added field for meeting link
  // Additional fields needed by components
  topic?: string;
  platform?: string;
  link?: string;
}

export interface Resource {
  resourceId: number;
  id?: number; // Added for API compatibility
  courseId: number;
  title: string;
  type: string;
  url: string;
  description?: string;
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
  // Additional fields needed by components
  activeStudents?: number;
  coursesPerCategory?: {categoryName: string, count: number}[];
  recentEnrollments?: {studentName: string, courseName: string, date: Date}[];
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
