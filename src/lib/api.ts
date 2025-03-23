
import { ApiResponse, AuthResponse, Batch, Course, CourseCategory, CourseReview, Role, Schedule, StudentBatch, User } from './types';

const API_URL = 'http://localhost:3000/api';

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.error || `Error: ${response.status} ${response.statusText}`
    };
  }
  
  const data = await response.json();
  return { success: true, data: data as T, message: data.message };
}

// Auth API functions
export async function login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
  try {
    // For demo, we'll simulate API call with mock data
    if (email === 'admin@lms.com' && password === 'Admin@123') {
      const mockUser: User = {
        id: 1,
        email: 'admin@lms.com',
        fullName: 'System Administrator',
        role: Role.ADMIN,
        isFirstLogin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const mockAuth: AuthResponse = {
        user: mockUser,
        token: 'mock-jwt-token-for-demo'
      };
      
      // Store in local storage
      localStorage.setItem('lms-auth', JSON.stringify(mockAuth));
      
      return { success: true, data: mockAuth };
    }
    
    return { 
      success: false, 
      error: 'Invalid credentials. Please try again.' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to login'
    };
  }
}

export async function logout(): Promise<void> {
  localStorage.removeItem('lms-auth');
}

// User API functions
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  try {
    const authData = localStorage.getItem('lms-auth');
    
    if (!authData) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const { user } = JSON.parse(authData) as AuthResponse;
    return { success: true, data: user };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get current user'
    };
  }
}

// Mock data functions - for demo purposes
export async function getCategories(): Promise<ApiResponse<CourseCategory[]>> {
  try {
    const mockCategories: CourseCategory[] = [
      { id: 1, categoryName: 'Web Development', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 2, categoryName: 'Mobile Development', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 3, categoryName: 'Data Science', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 4, categoryName: 'UI/UX Design', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 5, categoryName: 'DevOps', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    
    return { success: true, data: mockCategories };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get categories'
    };
  }
}

export async function getCourses(): Promise<ApiResponse<Course[]>> {
  try {
    const mockCourses: Course[] = [
      { 
        id: 1, 
        courseName: 'React Fundamentals', 
        description: 'Learn the basics of React including components, props, and state management.',
        courseLevel: 'BEGINNER',
        categoryId: 1,
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: { id: 1, categoryName: 'Web Development', createdAt: '', updatedAt: '' },
        students: 42,
        batches: 3,
        resources: 12,
        averageRating: 4.7
      },
      { 
        id: 2, 
        courseName: 'Advanced JavaScript', 
        description: 'Deep dive into JavaScript concepts including closures, promises, and async/await.',
        courseLevel: 'ADVANCED',
        categoryId: 1,
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: { id: 1, categoryName: 'Web Development', createdAt: '', updatedAt: '' },
        students: 38,
        batches: 2,
        resources: 18,
        averageRating: 4.9
      },
      { 
        id: 3, 
        courseName: 'Flutter for Beginners', 
        description: 'Introduction to building cross-platform mobile apps with Flutter.',
        courseLevel: 'BEGINNER',
        categoryId: 2,
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: { id: 2, categoryName: 'Mobile Development', createdAt: '', updatedAt: '' },
        students: 56,
        batches: 4,
        resources: 15,
        averageRating: 4.5
      },
      { 
        id: 4, 
        courseName: 'Python for Data Science', 
        description: 'Learn Python programming for data analysis and visualization.',
        courseLevel: 'INTERMEDIATE',
        categoryId: 3,
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: { id: 3, categoryName: 'Data Science', createdAt: '', updatedAt: '' },
        students: 78,
        batches: 5,
        resources: 22,
        averageRating: 4.8
      },
      { 
        id: 5, 
        courseName: 'UI Design Principles', 
        description: 'Understand the fundamentals of UI design and create beautiful interfaces.',
        courseLevel: 'BEGINNER',
        categoryId: 4,
        createdBy: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: { id: 4, categoryName: 'UI/UX Design', createdAt: '', updatedAt: '' },
        students: 45,
        batches: 3,
        resources: 16,
        averageRating: 4.6
      },
    ];
    
    return { success: true, data: mockCourses };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get courses'
    };
  }
}

export async function getBatches(): Promise<ApiResponse<Batch[]>> {
  try {
    const mockBatches: Batch[] = [
      { 
        id: 1, 
        batchName: 'React Fundamentals - May 2023', 
        courseId: 1,
        instructorId: 2,
        startDate: '2023-05-15T00:00:00Z',
        endDate: '2023-06-15T00:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        course: { id: 1, courseName: 'React Fundamentals', courseLevel: 'BEGINNER', categoryId: 1, createdBy: 1, createdAt: '', updatedAt: '' },
        instructor: { id: 2, email: 'john@example.com', fullName: 'John Doe', role: Role.INSTRUCTOR, isFirstLogin: false, createdAt: '', updatedAt: '' },
        studentsCount: 15
      },
      { 
        id: 2, 
        batchName: 'Advanced JavaScript - June 2023', 
        courseId: 2,
        instructorId: 3,
        startDate: '2023-06-01T00:00:00Z',
        endDate: '2023-07-15T00:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        course: { id: 2, courseName: 'Advanced JavaScript', courseLevel: 'ADVANCED', categoryId: 1, createdBy: 1, createdAt: '', updatedAt: '' },
        instructor: { id: 3, email: 'jane@example.com', fullName: 'Jane Smith', role: Role.INSTRUCTOR, isFirstLogin: false, createdAt: '', updatedAt: '' },
        studentsCount: 12
      },
      { 
        id: 3, 
        batchName: 'Flutter for Beginners - May 2023', 
        courseId: 3,
        instructorId: 2,
        startDate: '2023-05-10T00:00:00Z',
        endDate: '2023-06-25T00:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        course: { id: 3, courseName: 'Flutter for Beginners', courseLevel: 'BEGINNER', categoryId: 2, createdBy: 1, createdAt: '', updatedAt: '' },
        instructor: { id: 2, email: 'john@example.com', fullName: 'John Doe', role: Role.INSTRUCTOR, isFirstLogin: false, createdAt: '', updatedAt: '' },
        studentsCount: 18
      },
      { 
        id: 4, 
        batchName: 'Python for Data Science - July 2023', 
        courseId: 4,
        instructorId: 4,
        startDate: '2023-07-05T00:00:00Z',
        endDate: '2023-08-20T00:00:00Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        course: { id: 4, courseName: 'Python for Data Science', courseLevel: 'INTERMEDIATE', categoryId: 3, createdBy: 1, createdAt: '', updatedAt: '' },
        instructor: { id: 4, email: 'sam@example.com', fullName: 'Sam Wilson', role: Role.INSTRUCTOR, isFirstLogin: false, createdAt: '', updatedAt: '' },
        studentsCount: 20
      },
    ];
    
    return { success: true, data: mockBatches };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get batches'
    };
  }
}

export async function getUsers(role?: Role): Promise<ApiResponse<User[]>> {
  try {
    const mockUsers: User[] = [
      { 
        id: 1, 
        email: 'admin@lms.com', 
        fullName: 'System Administrator', 
        role: Role.ADMIN, 
        photoUrl: 'https://ui-avatars.com/api/?name=System+Administrator&background=0D8ABC&color=fff',
        isFirstLogin: false, 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      },
      { 
        id: 2, 
        email: 'john@example.com', 
        fullName: 'John Doe', 
        role: Role.INSTRUCTOR, 
        photoUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff',
        bio: 'Experienced web developer with 10+ years in React and JavaScript.',
        isFirstLogin: false, 
        createdAt: '2023-01-15T00:00:00Z', 
        updatedAt: '2023-01-15T00:00:00Z' 
      },
      { 
        id: 3, 
        email: 'jane@example.com', 
        fullName: 'Jane Smith', 
        role: Role.INSTRUCTOR, 
        photoUrl: 'https://ui-avatars.com/api/?name=Jane+Smith&background=0D8ABC&color=fff',
        bio: 'Full-stack developer specializing in JavaScript and Node.js.',
        isFirstLogin: false, 
        createdAt: '2023-01-20T00:00:00Z', 
        updatedAt: '2023-01-20T00:00:00Z' 
      },
      { 
        id: 4, 
        email: 'sam@example.com', 
        fullName: 'Sam Wilson', 
        role: Role.INSTRUCTOR, 
        photoUrl: 'https://ui-avatars.com/api/?name=Sam+Wilson&background=0D8ABC&color=fff',
        bio: 'Data scientist with expertise in Python and machine learning.',
        isFirstLogin: false, 
        createdAt: '2023-02-05T00:00:00Z', 
        updatedAt: '2023-02-05T00:00:00Z' 
      },
      { 
        id: 5, 
        email: 'alex@example.com', 
        fullName: 'Alex Johnson', 
        role: Role.STUDENT, 
        photoUrl: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=0D8ABC&color=fff',
        isFirstLogin: false, 
        createdAt: '2023-03-10T00:00:00Z', 
        updatedAt: '2023-03-10T00:00:00Z' 
      },
      { 
        id: 6, 
        email: 'maria@example.com', 
        fullName: 'Maria Garcia', 
        role: Role.STUDENT, 
        photoUrl: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=0D8ABC&color=fff',
        isFirstLogin: false, 
        createdAt: '2023-03-15T00:00:00Z', 
        updatedAt: '2023-03-15T00:00:00Z' 
      },
    ];
    
    if (role) {
      return { 
        success: true, 
        data: mockUsers.filter(user => user.role === role) 
      };
    }
    
    return { success: true, data: mockUsers };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get users'
    };
  }
}

export async function getDashboardStats(): Promise<ApiResponse<any>> {
  try {
    const courses = await getCourses();
    const batches = await getBatches();
    const instructors = await getUsers(Role.INSTRUCTOR);
    const students = await getUsers(Role.STUDENT);
    
    if (!courses.success || !batches.success || !instructors.success || !students.success) {
      return { success: false, error: 'Failed to get dashboard data' };
    }
    
    const mockStats = {
      totalStudents: students.data?.length || 0,
      totalInstructors: instructors.data?.length || 0,
      totalCourses: courses.data?.length || 0,
      totalBatches: batches.data?.length || 0,
      recentCourses: courses.data?.slice(0, 3) || [],
      upcomingBatches: batches.data?.slice(0, 3) || [],
      popularCourses: [
        { courseName: 'Python for Data Science', enrollments: 78 },
        { courseName: 'Flutter for Beginners', enrollments: 56 },
        { courseName: 'UI Design Principles', enrollments: 45 },
        { courseName: 'React Fundamentals', enrollments: 42 },
        { courseName: 'Advanced JavaScript', enrollments: 38 }
      ],
      studentsDemographics: {
        'Web Development': 80,
        'Mobile Development': 56,
        'Data Science': 78,
        'UI/UX Design': 45,
        'DevOps': 25
      }
    };
    
    return { success: true, data: mockStats };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get dashboard statistics'
    };
  }
}
