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

export enum Status {
  present = 'present',
  absent = 'absent',
  late = 'late'
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
  createdAt?: string; // Changed from Date to string
  updatedAt?: string; // Changed from Date to string
  averageRating?: number;
  createdBy?: any; // Added createdBy property
  _count?: {
    studentCourses: number;
    batches: number;
    resources?: number;
    schedules?: number;
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
    startDate: Date;
    endDate: Date;
    description?: string;
    schedules?: Schedule[];
    instructor?: {
      userId: number;
      fullName: string;
    };
  }>;
  category?: CourseCategory;
  reviews?: CourseReview[];
  instructorCourses?: InstructorCourse[];
  resources?: Resource[];
};

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
  description?: string; // Adding description property
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
  presignedUrl?: string; // Added presignedUrl
  batch?: { // Adding batch property
    batchId: number;
    batchName: string;
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
  user?: User; // Adding user property
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

// Add missing InstructorCourse interface
export interface InstructorCourse {
  instructorCourseId: number; 
  instructorId: number;
  courseId: number;
  createdAt: string;
  updatedAt: string;
  instructor?: User;
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

// Export AttendanceAnalytics interface to be used across the application
export interface AttendanceAnalytics {
  overall: {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  byBatch?: Array<{
    batchId: number;
    batchName: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
    scheduleDate?: string;
    startTime?: string;
    endTime?: string;
  }>;
  students?: Array<{
    userId: number;
    fullName: string;
    email: string;
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  }>;
  history?: Array<{
    attendanceId: number;
    scheduleId: number;
    userId: number;
    status: Status;
    markedAt: string;
    user: {
      userId: number;  
      fullName: string;
      email: string;
      role: Role;
    };
    schedule: {
      topic: string;
      scheduleDate: string;
      startTime: string;
      endTime: string;
      batch?: {      
        batchName: string;
        instructor?: {
          fullName: string;
        };
      };
    };
    markedByUser: {
      fullName: string;
      email: string;
      role: Role;
    };
  }>;
  totalClasses?: number;
  totalStudents?: number;
}

export interface InitiateUploadResponse {
  success: boolean;
  key: string;
  uploadId: string;
  error?: string;
}


export interface UploadPartResponse {
  success: boolean;
  ETag: string;
  PartNumber: number;
  error?: string;
}

