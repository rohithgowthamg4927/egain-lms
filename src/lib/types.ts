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
  id?: number; // Adding ID as optional for backward compatibility
  fullName: string;
  email: string;
  role: Role;
  phoneNumber?: string | null;
  address?: string | null;
  bio?: string | null;
  password?: string;
  mustResetPassword?: boolean;
  createdAt: string;
  updatedAt: string;
  profilePictureId?: number;
  profilePicture?: ProfilePicture;
  // Additional fields needed by components
  photoUrl?: string;
  enrollmentDate?: string; // Used for displaying when a student enrolled in a batch
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

export type Course = {
  courseId: number;
  courseName: string;
  courseLevel: Level;
  categoryId?: number;
  description?: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  averageRating?: number;
  _count?: {
    studentCourses: number;
    batches: number;
  };
  studentCourses?: Array<{
    studentCourseId: number;
    studentId?: number;
    courseId?: number;
    student?: User;  // Using the User type directly
  }>;
  batches?: Array<{
    batchId: number;
    batchName: string;
    startDate: string;
    endDate: string;
    instructor?: {
      userId: number;
      fullName: string;
    };
  }>;
  category?: CourseCategory;
  reviews?: CourseReview[];
  instructors?: InstructorCourseAssignment[];
  createdBy?: User;  // Add the createdBy property to the Course type
};

export interface InstructorCourseAssignment {
  instructorId: number;
  courseId: number;
  instructor?: User;
  course?: Course;
}

export interface Category {
  categoryId: number;
  id?: number; // Adding ID as optional for backward compatibility
  categoryName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  courses?: Course[];
  coursesCount?: number; // Added for UI display
}

// Adding CourseCategory as an alias to Category to maintain backwards compatibility
export type CourseCategory = Category;

export interface Batch {
  batchId: number;
  id?: number; // Adding ID as optional for backward compatibility
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
  students?: any[]; // Array of enrolled students
  studentsCount?: number; // Count of enrolled students
  schedules?: Schedule[]; // Array of batch schedules
}

export interface Schedule {
  scheduleId: number;
  batchId?: number; // Adding batchId as optional 
  startTime: string;
  endTime: string;
  scheduleDate: string;
  createdAt: string;
  updatedAt: string;
  meetingLink?: string; // Meeting link field
  topic?: string; // Topic for the session
  platform?: string; // Platform used for the session
  description?: string;
  batch?: Batch;
}

export interface StudentBatch {
  studentBatchId: number;
  studentId: number;
  batchId: number;
  createdAt: string;
  updatedAt: string;
  student?: User;
  batch?: Batch;
}

export interface Resource {
  resourceId: number;
  id?: number; // Adding ID as optional for backward compatibility
  courseId?: number; // Adding courseId as optional
  title: string;
  type?: string;
  url?: string;
  resourceType: "assignment" | "recording";
  uploadedBy: { fullName: string; userId?: number };
  description?: string;
  fileName: string; // Making fileName required
  fileUrl: string; // Making fileUrl required
  batchId?: number; // Adding batchId as optional
  uploadedById?: number; // Adding uploadedById as optional
  createdAt: string;
  updatedAt: string;
  batch?: { // Adding batch property with instructorId
    batchId: number;
    batchName: string;
    instructorId?: number;
    course: {
      courseId: number;
      courseName: string;
    };
  };
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

export interface StudentCourse {
  studentCourseId: number;
  studentId: number;
  courseId: number;
  createdAt: string;
  updatedAt: string;
  student?: User;
  course?: Course;
}

export interface DashboardMetrics {
  counts: {
    students: number;
    instructors: number;
    courses: number;
  };
  coursesByCategory: {
    categoryId: number;
    categoryName: string;
    coursesCount: number;
    courses: {
      courseId: number;
      courseName: string;
      studentsCount: number;
    }[];
  }[];
  recentBatches: {
    batchId: number;
    batchName: string;
    startDate: string;
    endDate: string;
    course: Course;
    instructor: User;
    studentsCount: number;
  }[];
  popularCourses: {
    course: {
      courseId: number;
      courseName: string;
      description?: string;
      category?: {
        categoryId: number;
        categoryName: string;
      };
    };
    _count: {
      students: number;
    };
  }[];
  upcomingSchedules: {
    scheduleId: number;
    startTime: string;
    scheduleDate: string;
    endTime: string;
    topic: string;
    platform: string;
    meetingLink?: string;
    batch: {
      batchId: number;
      batchName: string;
      course: {
        courseId: number;
        courseName: string;
      };
      instructor: {
        userId: number;
        fullName: string;
      };
    };
  }[];
  categoryDistribution: {
    name: string;
    value: number;
  }[];
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
