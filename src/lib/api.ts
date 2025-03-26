import { CourseCategory, Level, Course, User, Role, Batch, Resource, DashboardMetrics, Schedule } from '@/lib/types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Mock data for browser environment
const mockUsers = [
  {
    userId: 1,
    fullName: 'Admin User',
    email: 'admin@lms.com',
    role: Role.admin,
    phoneNumber: null,
    mustResetPassword: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    photoUrl: 'https://i.pravatar.cc/150?img=1'
  }
];

// Generic fetch function with error handling
const apiCall = async <T>(
  action: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const result = await action();
    return { success: true, data: result };
  } catch (error) {
    console.error("API Error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    };
  }
};

// Authentication API
export const getCurrentUser = async (): Promise<{ success: boolean; data?: User; error?: string }> => {
  // In browser environment, return mock data
  if (isBrowser) {
    return { success: true, data: mockUsers[0] };
  }
  
  // In Node.js environment, use prisma (this code won't run in browser)
  try {
    // Import Prisma dynamically to prevent browser from loading it
    const { prisma } = await import('./prisma');
    
    const users = await prisma.user.findMany({
      where: { role: 'admin' },
      take: 1,
      include: {
        profilePicture: true
      }
    });
    
    if (users.length > 0) {
      // This function should be imported dynamically if needed
      const { mapApiUser } = await import('./api-helpers');
      return { success: true, data: mapApiUser(users[0]) };
    }
    
    return { success: false, error: 'No user found' };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return { success: false, error: 'Failed to fetch current user' };
  }
};

export const login = async (email: string, password: string, role: Role): Promise<{ success: boolean; data?: { user: User; token: string }; error?: string }> => {
  // For browser testing, allow login with any credentials
  if (isBrowser) {
    // Create a mock user based on the role
    const mockUser = {
      ...mockUsers[0],
      fullName: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      email,
      role
    };
    
    return {
      success: true,
      data: {
        user: mockUser,
        token: 'mock-jwt-token'
      }
    };
  }
  
  // In Node.js environment, use prisma (this code won't run in browser)
  try {
    const { prisma } = await import('./prisma');
    const { mapApiUser } = await import('./api-helpers');
    
    const user = await prisma.user.findFirst({
      where: { 
        email,
        role,
        password // In a real app, you would hash the password
      },
      include: {
        profilePicture: true
      }
    });
    
    if (user) {
      return {
        success: true,
        data: {
          user: mapApiUser(user),
          token: 'mock-jwt-token'
        }
      };
    }
    
    return {
      success: false,
      error: 'Invalid credentials'
    };
  } catch (error) {
    return {
      success: false,
      error: 'An error occurred during login'
    };
  }
};

export const logout = async (): Promise<{ success: boolean }> => {
  // In a real app, this would clear tokens, etc.
  return { success: true };
};

// Mock implementations for browser environment
// These implementations will return mock data in browser
// In a real production app, these would likely call REST APIs

// User Management API
export const createUser = async (userData: Partial<User>, profilePicture?: File): Promise<{ success: boolean; data?: User; error?: string }> => {
  if (isBrowser) {
    console.log('Mock createUser called with:', userData, profilePicture);
    return {
      success: true,
      data: {
        userId: Date.now(),
        fullName: userData.fullName || 'New User',
        email: userData.email || 'user@example.com',
        role: userData.role || Role.student,
        phoneNumber: userData.phoneNumber || null,
        mustResetPassword: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photoUrl: userData.photoUrl || 'https://i.pravatar.cc/150?img=12'
      }
    };
  }
  
  // This part won't be executed in browser
  // It would need to be implemented for Node.js environment
  return { success: false, error: 'Not implemented for server environment' };
};

// Mock implementations for other API functions
export const updateUser = async (userId: number, userData: Partial<User>, profilePicture?: File): Promise<{ success: boolean; data?: User; error?: string }> => {
  if (isBrowser) {
    console.log('Mock updateUser called with:', userId, userData, profilePicture);
    return {
      success: true,
      data: {
        userId,
        ...mockUsers[0],
        ...userData,
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

export const changePassword = async (userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  if (isBrowser) {
    console.log('Mock changePassword called with:', userId, newPassword);
    return { success: true };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

export const deleteUser = async (id: number): Promise<{ success: boolean; error?: string }> => {
  if (isBrowser) {
    console.log('Mock deleteUser called with:', id);
    return { success: true };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Mock implementations for categories
export const getCategories = async (): Promise<{ success: boolean; data?: CourseCategory[]; error?: string }> => {
  if (isBrowser) {
    return {
      success: true,
      data: [
        { categoryId: 1, categoryName: 'Web Development', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { categoryId: 2, categoryName: 'Mobile Development', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { categoryId: 3, categoryName: 'Data Science', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]
    };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

export const createCategory = async (categoryData: Partial<CourseCategory>): Promise<{ success: boolean; data?: CourseCategory; error?: string }> => {
  if (isBrowser) {
    return {
      success: true,
      data: {
        categoryId: Date.now(),
        categoryName: categoryData.categoryName || 'New Category',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Users API
export const getUsers = async (role?: Role): Promise<{ success: boolean; data?: User[]; error?: string }> => {
  if (isBrowser) {
    // Generate mock users based on role
    let users = [mockUsers[0]];
    
    if (role === Role.student) {
      users = [
        { ...mockUsers[0], userId: 2, fullName: 'Student 1', email: 'student1@lms.com', role: Role.student },
        { ...mockUsers[0], userId: 3, fullName: 'Student 2', email: 'student2@lms.com', role: Role.student }
      ];
    } else if (role === Role.instructor) {
      users = [
        { ...mockUsers[0], userId: 4, fullName: 'Instructor 1', email: 'instructor1@lms.com', role: Role.instructor },
        { ...mockUsers[0], userId: 5, fullName: 'Instructor 2', email: 'instructor2@lms.com', role: Role.instructor }
      ];
    }
    
    return { success: true, data: users };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Alias for backward compatibility
export const fetchUsers = getUsers;

// Courses API
export const getCourses = async (): Promise<{ success: boolean; data?: Course[]; error?: string }> => {
  if (isBrowser) {
    return {
      success: true,
      data: [
        {
          courseId: 1,
          courseName: 'React Fundamentals',
          description: 'Learn the basics of React',
          courseLevel: Level.beginner,
          categoryId: 1,
          category: { categoryId: 1, categoryName: 'Web Development', createdAt: '', updatedAt: '' },
          thumbnailUrl: 'https://example.com/react.jpg',
          durationHours: 10,
          isPublished: true,
          students: 25,
          batches: 2,
          averageRating: 4.5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          courseId: 2,
          courseName: 'Advanced React',
          description: 'Master React and Redux',
          courseLevel: Level.advanced,
          categoryId: 1,
          category: { categoryId: 1, categoryName: 'Web Development', createdAt: '', updatedAt: '' },
          thumbnailUrl: 'https://example.com/advanced-react.jpg',
          durationHours: 15,
          isPublished: true,
          students: 15,
          batches: 1,
          averageRating: 4.8,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Alias for backward compatibility
export const fetchCourses = getCourses;

// Implement other API functions as needed with mock data for browser environment
export const fetchCourseById = async (id: number): Promise<Course | null> => {
  if (isBrowser) {
    const courses = (await getCourses()).data || [];
    return courses.find(course => course.courseId === id) || null;
  }
  
  return null;
};

export const createCourse = async (courseData: Partial<Course>, thumbnail?: File): Promise<{ success: boolean; data?: Course; error?: string }> => {
  if (isBrowser) {
    return {
      success: true,
      data: {
        courseId: Date.now(),
        courseName: courseData.courseName || 'New Course',
        description: courseData.description || '',
        courseLevel: courseData.courseLevel || Level.beginner,
        categoryId: courseData.categoryId || 1,
        category: { categoryId: 1, categoryName: 'Web Development', createdAt: '', updatedAt: '' },
        thumbnailUrl: courseData.thumbnailUrl || 'https://example.com/placeholder.jpg',
        durationHours: courseData.durationHours || 10,
        isPublished: courseData.isPublished || false,
        students: 0,
        batches: 0,
        averageRating: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Mock implementations for batches
export const getBatches = async (courseId?: number): Promise<{ success: boolean; data?: Batch[]; error?: string }> => {
  if (isBrowser) {
    const batches = [
      {
        batchId: 1,
        batchName: 'Batch 1',
        courseId: 1,
        course: (await getCourses()).data?.[0],
        instructorId: 4,
        instructor: (await getUsers(Role.instructor)).data?.[0],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        students: 15,
        studentsCount: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        batchId: 2,
        batchName: 'Batch 2',
        courseId: 2,
        course: (await getCourses()).data?.[1],
        instructorId: 5,
        instructor: (await getUsers(Role.instructor)).data?.[1],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
        students: 10,
        studentsCount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    if (courseId) {
      return { success: true, data: batches.filter(batch => batch.courseId === courseId) };
    }
    
    return { success: true, data: batches };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Alias for backward compatibility
export const fetchBatches = getBatches;

// Mock implementation for other required functions
export const createBatch = async (batchData: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  if (isBrowser) {
    return {
      success: true,
      data: {
        batchId: Date.now(),
        batchName: batchData.batchName || 'New Batch',
        courseId: batchData.courseId || 1,
        course: (await getCourses()).data?.[0],
        instructorId: batchData.instructorId || 4,
        instructor: (await getUsers(Role.instructor)).data?.[0],
        startDate: batchData.startDate || new Date().toISOString(),
        endDate: batchData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        students: 0,
        studentsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Mock implementations for schedules
export const getSchedules = async (batchId?: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  if (isBrowser) {
    const schedules = [
      {
        scheduleId: 1,
        id: 1,
        batchId: 1,
        dayOfWeek: 1, // Monday
        startTime: '09:00:00',
        endTime: '11:00:00',
        topic: 'Introduction to React',
        platform: 'zoom',
        link: 'https://zoom.us/j/123456789',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        scheduleId: 2,
        id: 2,
        batchId: 1,
        dayOfWeek: 3, // Wednesday
        startTime: '09:00:00',
        endTime: '11:00:00',
        topic: 'React Components',
        platform: 'zoom',
        link: 'https://zoom.us/j/123456789',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    if (batchId) {
      return { success: true, data: schedules.filter(schedule => schedule.batchId === batchId) };
    }
    
    return { success: true, data: schedules };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Alias for backward compatibility
export const fetchSchedules = getSchedules;

export const createSchedule = async (scheduleData: Partial<Schedule>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  if (isBrowser) {
    return {
      success: true,
      data: {
        scheduleId: Date.now(),
        id: Date.now(),
        batchId: scheduleData.batchId || 1,
        dayOfWeek: scheduleData.dayOfWeek || 1,
        startTime: scheduleData.startTime || '09:00:00',
        endTime: scheduleData.endTime || '11:00:00',
        topic: scheduleData.topic || 'New Schedule',
        platform: scheduleData.platform || 'zoom',
        link: scheduleData.link || 'https://zoom.us/j/123456789',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Mock implementations for resources
export const getResources = async (courseId?: number): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  if (isBrowser) {
    const resources = [
      {
        resourceId: 1,
        id: 1,
        courseId: 1,
        title: 'React Documentation',
        type: 'link',
        url: 'https://reactjs.org',
        description: 'Official React documentation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        resourceId: 2,
        id: 2,
        courseId: 1,
        title: 'React Slides',
        type: 'pdf',
        url: 'https://example.com/slides.pdf',
        description: 'Lecture slides',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    if (courseId) {
      return { success: true, data: resources.filter(resource => resource.courseId === courseId) };
    }
    
    return { success: true, data: resources };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Alias for backward compatibility
export const fetchResources = getResources;

// Dashboard metrics
export const getDashboardMetrics = async (): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> => {
  if (isBrowser) {
    return {
      success: true,
      data: {
        totalStudents: 125,
        totalInstructors: 15,
        totalCourses: 10,
        totalBatches: 20,
        activeStudents: 100,
        coursesPerCategory: [
          { categoryName: 'Web Development', count: 5 },
          { categoryName: 'Mobile Development', count: 3 },
          { categoryName: 'Data Science', count: 2 }
        ],
        recentEnrollments: [
          { 
            studentName: 'John Doe', 
            courseName: 'React Fundamentals', 
            date: new Date()  // Convert to actual Date object
          },
          { 
            studentName: 'Jane Smith', 
            courseName: 'Advanced React', 
            date: new Date()  // Convert to actual Date object
          }
        ],
        recentUsers: [
          { ...mockUsers[0], userId: 6, fullName: 'Recent User 1', email: 'recent1@lms.com' },
          { ...mockUsers[0], userId: 7, fullName: 'Recent User 2', email: 'recent2@lms.com' }
        ],
        upcomingBatches: [
          {
            batchId: 3,
            batchName: 'Upcoming Batch 1',
            courseId: 1,
            course: (await getCourses()).data?.[0],
            instructorId: 4,
            instructor: (await getUsers(Role.instructor)).data?.[0],
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000).toISOString(), // 37 days from now
            students: 0,
            studentsCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

// Student enrollment functions
export const enrollStudentToBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  if (isBrowser) {
    console.log(`Mock enrollStudentToBatch: Student ${studentId} enrolled to batch ${batchId}`);
    return { success: true };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

export const unenrollStudentFromBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  if (isBrowser) {
    console.log(`Mock unenrollStudentFromBatch: Student ${studentId} unenrolled from batch ${batchId}`);
    return { success: true };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

export const enrollStudentToCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  if (isBrowser) {
    console.log(`Mock enrollStudentToCourse: Student ${studentId} enrolled to course ${courseId}`);
    return { success: true };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

export const unenrollStudentFromCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  if (isBrowser) {
    console.log(`Mock unenrollStudentFromCourse: Student ${studentId} unenrolled from course ${courseId}`);
    return { success: true };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};

export const uploadScheduleRecording = async (
  file: File,
  scheduleId: number,
  batchId: number
): Promise<{ success: boolean; data?: { fileUrl: string }; error?: string }> => {
  if (isBrowser) {
    console.log(`Mock uploadScheduleRecording: Uploaded recording for schedule ${scheduleId} in batch ${batchId}`);
    return { success: true, data: { fileUrl: URL.createObjectURL(file) } };
  }
  
  return { success: false, error: 'Not implemented for server environment' };
};
