import { CourseCategory, Level, Course, User, Role, Batch, Resource, DashboardMetrics, Schedule } from '@/lib/types';
import { uploadProfilePicture, uploadCourseThumbnail, uploadClassRecording } from '@/lib/s3-upload';
import { generateRandomPassword } from '@/lib/utils';
import { dateToString } from '@/lib/utils/date-helpers';

// Base API URL - Use environment variable with fallback to localhost
// The API_URL can be configured based on your deployment environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Fetching from: ${url}`, options);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    console.log(`Response from ${url}:`, data);
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`, data);
      return { 
        success: false, 
        error: data.error || `API error: ${response.status} ${response.statusText}` 
      };
    }
    
    return data;
  } catch (error) {
    console.error('API fetch error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch data from API' 
    };
  }
}

// Authentication API
export const getCurrentUser = async (): Promise<{ success: boolean; data?: User; error?: string }> => {
  const users = await fetchUsers();
  return { success: true, data: users[0] }; // Mock admin user for now
};

export const login = async (email: string, password: string, role: Role): Promise<{ success: boolean; data?: { user: User; token: string }; error?: string }> => {
  console.log("Calling login API with:", { email, role });
  return apiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
};

export const logout = async (): Promise<{ success: boolean }> => {
  // In a real app, this would clear tokens, etc.
  return { success: true };
};

// User Management API
export const createUser = async (userData: Partial<User>, profilePicture?: File): Promise<{ success: boolean; data?: User; error?: string }> => {
  try {
    // Generate random password
    const password = generateRandomPassword(8);
    
    // Upload profile picture if provided
    let photoUrl = userData.photoUrl;
    if (profilePicture) {
      photoUrl = await uploadProfilePicture(profilePicture, Date.now());
    }
    
    // Create new user
    const userDataToSend = {
      fullName: userData.fullName || '',
      email: userData.email || '',
      role: userData.role || Role.student,
      photoUrl,
      phoneNumber: userData.phoneNumber,
      bio: userData.bio,
      password,
      mustResetPassword: true,
    };
    
    return apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userDataToSend),
    });
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create user' 
    };
  }
};

export const updateUser = async (userId: number, userData: Partial<User>, profilePicture?: File): Promise<{ success: boolean; data?: User; error?: string }> => {
  // Implementation would connect to real backend API
  try {
    // Upload profile picture if provided
    if (profilePicture) {
      userData.photoUrl = await uploadProfilePicture(profilePicture, userId);
    }
    
    // For now, this is a mock implementation
    const users = await fetchUsers();
    const userIndex = users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    
    // Update user
    const updatedUser: User = {
      ...users[userIndex],
      ...userData,
      updatedAt: dateToString(new Date())
    };
    
    return { success: true, data: updatedUser };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user' 
    };
  }
};

// Users API
export const fetchUsers = async (role?: Role): Promise<User[]> => {
  const endpoint = role ? `/users?role=${role}` : '/users';
  const response = await apiFetch<User[]>(endpoint);
  
  if (response.success && response.data) {
    return response.data;
  }
  
  console.error('Error fetching users:', response.error);
  return [];
};

// Alias for fetchUsers to match usage in components
export const getUsers = async (role?: Role): Promise<{ success: boolean; data?: User[]; error?: string }> => {
  try {
    const users = await fetchUsers(role);
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: 'Failed to fetch users' };
  }
};

// Course Categories API
export const fetchCourseCategories = async (): Promise<CourseCategory[]> => {
  const response = await apiFetch<CourseCategory[]>('/categories');
  
  if (response.success && response.data) {
    return response.data;
  }
  
  console.error('Error fetching categories:', response.error);
  return [];
};

export const getCategories = async (): Promise<{ success: boolean; data?: CourseCategory[]; error?: string }> => {
  try {
    const categories = await fetchCourseCategories();
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: 'Failed to fetch categories' };
  }
};

export const createCategory = async (categoryData: Partial<CourseCategory>): Promise<{ success: boolean; data?: CourseCategory; error?: string }> => {
  return apiFetch('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
};

// Courses API
export const fetchCourses = async (): Promise<Course[]> => {
  const response = await apiFetch<Course[]>('/courses');
  
  if (response.success && response.data) {
    return response.data;
  }
  
  console.error('Error fetching courses:', response.error);
  return [];
};

// Alias for fetchCourses to match usage in components
export const getCourses = async (): Promise<{ success: boolean; data?: Course[]; error?: string }> => {
  try {
    const courses = await fetchCourses();
    return { success: true, data: courses };
  } catch (error) {
    return { success: false, error: 'Failed to fetch courses' };
  }
};

// Batches API
export const fetchBatches = async (courseId?: number): Promise<Batch[]> => {
  const endpoint = courseId ? `/batches?courseId=${courseId}` : '/batches';
  const response = await apiFetch<Batch[]>(endpoint);
  
  if (response.success && response.data) {
    return response.data;
  }
  
  console.error('Error fetching batches:', response.error);
  return [];
};

// Alias for fetchBatches to match usage in components
export const getBatches = async (courseId?: number): Promise<{ success: boolean; data?: Batch[]; error?: string }> => {
  try {
    const batches = await fetchBatches(courseId);
    return { success: true, data: batches };
  } catch (error) {
    return { success: false, error: 'Failed to fetch batches' };
  }
};

// Dashboard metrics
export const getDashboardMetrics = async (): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> => {
  return apiFetch('/dashboard-metrics');
};

// The remaining functions would be implemented similarly, connecting to the backend API
// For now, I'm keeping them as stubs to maintain compatibility with existing code

// Many methods below are still mock implementations
// They would need to be replaced with real API calls in a production app
export const createCourse = async (courseData: Partial<Course>, thumbnail?: File): Promise<{ success: boolean; data?: Course; error?: string }> => {
  try {
    // Upload thumbnail if provided
    let thumbnailUrl = courseData.thumbnailUrl;
    if (thumbnail) {
      thumbnailUrl = await uploadCourseThumbnail(thumbnail, Date.now());
    }
    
    // Create new course with generated ID
    const newId = Date.now();
    const newCourse: Course = {
      id: newId,
      courseId: newId,
      courseName: courseData.courseName || '',
      description: courseData.description || '',
      courseLevel: courseData.courseLevel || Level.beginner,
      categoryId: courseData.categoryId || 1,
      thumbnailUrl,
      students: 0,
      batches: 0,
      createdAt: dateToString(new Date()),
      updatedAt: dateToString(new Date()),
      createdBy: courseData.createdBy || 1,
      isPublished: courseData.isPublished || false,
    };
    
    // Add category for consistency
    const categories = await fetchCourseCategories();
    newCourse.category = categories.find(c => c.id === newCourse.categoryId);
    
    return { success: true, data: newCourse };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create course' 
    };
  }
};

// Fetch a single course by ID
export const fetchCourseById = async (id: number): Promise<Course | null> => {
  const courses = await fetchCourses();
  const course = courses.find(course => course.id === id) || null;
  return course;
};

export const createBatch = async (batchData: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  try {
    // Check if batch with same name already exists for the course
    const batches = await fetchBatches(batchData.courseId);
    const duplicateBatch = batches.find(b => 
      b.courseId === batchData.courseId && 
      b.batchName.toLowerCase() === batchData.batchName?.toLowerCase()
    );
    
    if (duplicateBatch) {
      return {
        success: false,
        error: `A batch with name "${batchData.batchName}" already exists for this course`
      };
    }
    
    // Create new batch with generated ID
    const newId = Date.now();
    const newBatch: Batch = {
      id: newId,
      batchId: newId,
      batchName: batchData.batchName || '',
      courseId: batchData.courseId || 0,
      instructorId: batchData.instructorId || 0,
      startDate: dateToString(batchData.startDate || new Date()),
      endDate: dateToString(batchData.endDate || new Date()),
      students: 0,
      createdAt: dateToString(new Date()),
      updatedAt: dateToString(new Date()),
    };
    
    // Add course and instructor for consistency
    const courses = await fetchCourses();
    const users = await fetchUsers();
    
    const course = courses.find(c => c.id === newBatch.courseId);
    const instructor = users.find(u => u.id === newBatch.instructorId);
    
    return { 
      success: true, 
      data: {
        ...newBatch,
        course,
        instructor,
        studentsCount: 0
      } as any
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create batch' 
    };
  }
};

// Schedules API
export const fetchSchedules = async (batchId?: number): Promise<Schedule[]> => {
  const schedules: Schedule[] = [
    {
      id: 1,
      scheduleId: 1,
      batchId: 1,
      dayOfWeek: 1,
      startTime: dateToString(new Date('2023-06-05T17:00:00')),
      endTime: dateToString(new Date('2023-06-05T18:30:00')),
      topic: 'Introduction to React Basics',
      platform: 'zoom',
      link: 'https://zoom.us/j/123456789',
      createdAt: dateToString(new Date('2023-05-20')),
      updatedAt: dateToString(new Date('2023-05-20')),
    },
    {
      id: 2,
      scheduleId: 2,
      batchId: 1,
      dayOfWeek: 3,
      startTime: dateToString(new Date('2023-06-07T17:00:00')),
      endTime: dateToString(new Date('2023-06-07T18:30:00')),
      topic: 'Components and Props',
      platform: 'zoom',
      link: 'https://zoom.us/j/123456789',
      createdAt: dateToString(new Date('2023-05-20')),
      updatedAt: dateToString(new Date('2023-05-20')),
    },
    {
      id: 3,
      scheduleId: 3,
      batchId: 2,
      dayOfWeek: 6,
      startTime: dateToString(new Date('2023-06-10T10:00:00')),
      endTime: dateToString(new Date('2023-06-10T11:30:00')),
      topic: 'React Weekend Workshop',
      platform: 'google-meet',
      link: 'https://meet.google.com/abc-defg-hij',
      createdAt: dateToString(new Date('2023-05-25')),
      updatedAt: dateToString(new Date('2023-05-25')),
    },
    {
      id: 4,
      scheduleId: 4,
      batchId: 3,
      dayOfWeek: 1,
      startTime: dateToString(new Date('2023-07-03T18:00:00')),
      endTime: dateToString(new Date('2023-07-03T19:30:00')),
      topic: 'JavaScript Design Patterns',
      platform: 'zoom',
      link: 'https://zoom.us/j/987654321',
      createdAt: dateToString(new Date('2023-06-15')),
      updatedAt: dateToString(new Date('2023-06-15')),
    },
    {
      id: 5,
      scheduleId: 5,
      batchId: 4,
      dayOfWeek: 1,
      startTime: dateToString(new Date('2023-06-05T09:00:00')),
      endTime: dateToString(new Date('2023-06-05T10:30:00')),
      topic: 'Flutter UI Basics',
      platform: 'zoom',
      link: 'https://zoom.us/j/567891234',
      createdAt: dateToString(new Date('2023-05-20')),
      updatedAt: dateToString(new Date('2023-05-20')),
    },
  ];

  if (batchId) {
    return schedules.filter(schedule => schedule.batchId === batchId);
  }
  
  return schedules;
};

export const getSchedules = async (batchId?: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  try {
    const schedules = await fetchSchedules(batchId);
    return { success: true, data: schedules };
  } catch (error) {
    return { success: false, error: 'Failed to fetch schedules' };
  }
};

export const createSchedule = async (scheduleData: Partial<Schedule>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  try {
    // Create new schedule with generated ID
    const newId = Date.now();
    const newSchedule: Schedule = {
      id: newId,
      scheduleId: newId,
      batchId: scheduleData.batchId || 0,
      dayOfWeek: scheduleData.dayOfWeek || 1,
      startTime: dateToString(scheduleData.startTime || new Date()),
      endTime: dateToString(scheduleData.endTime || new Date()),
      topic: scheduleData.topic || '',
      platform: scheduleData.platform || 'zoom',
      link: scheduleData.link || '',
      createdAt: dateToString(new Date()),
      updatedAt: dateToString(new Date()),
    };
    
    return { success: true, data: newSchedule };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create schedule' 
    };
  }
};

export const uploadScheduleRecording = async (
  file: File,
  scheduleId: number,
  batchId: number
): Promise<{ success: boolean; data?: { fileUrl: string }; error?: string }> => {
  try {
    const fileUrl = await uploadClassRecording(file, batchId, scheduleId);
    return {
      success: true,
      data: { fileUrl }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload recording'
    };
  }
};

// Resources API
export const fetchResources = async (courseId?: number): Promise<Resource[]> => {
  const resources: Resource[] = [
    {
      id: 1,
      resourceId: 1,
      title: 'React Fundamentals Slides',
      description: 'Slide deck covering React basics and component lifecycle',
      url: 'https://example.com/resources/react-slides.pdf',
      type: 'document',
      courseId: 1,
      createdAt: dateToString(new Date('2023-05-15')),
      updatedAt: dateToString(new Date('2023-05-15')),
    },
    {
      id: 2,
      resourceId: 2,
      title: 'React Hooks Demo Code',
      description: 'Example code demonstrating React hooks usage',
      url: 'https://github.com/example/react-hooks-demo',
      type: 'code',
      courseId: 1,
      createdAt: dateToString(new Date('2023-05-20')),
      updatedAt: dateToString(new Date('2023-05-20')),
    },
    {
      id: 3,
      resourceId: 3,
      title: 'Advanced JavaScript Patterns Handbook',
      description: 'Comprehensive guide to JS design patterns',
      url: 'https://example.com/resources/js-patterns.pdf',
      type: 'document',
      courseId: 2,
      createdAt: dateToString(new Date('2023-05-25')),
      updatedAt: dateToString(new Date('2023-05-25')),
    },
    {
      id: 4,
      resourceId: 4,
      title: 'Flutter Setup Guide',
      description: 'Step-by-step guide for setting up Flutter development environment',
      url: 'https://example.com/resources/flutter-setup.pdf',
      type: 'document',
      courseId: 3,
      createdAt: dateToString(new Date('2023-05-10')),
      updatedAt: dateToString(new Date('2023-05-10')),
    },
    {
      id: 5,
      resourceId: 5,
      title: 'Python Data Analysis Code Samples',
      description: 'Sample code for data analysis with pandas and matplotlib',
      url: 'https://github.com/example/python-data-analysis',
      type: 'code',
      courseId: 4,
      createdAt: dateToString(new Date('2023-06-05')),
      updatedAt: dateToString(new Date('2023-06-05')),
    },
  ];

  if (courseId) {
    return resources.filter(resource => resource.courseId === courseId);
  }
  return resources;
};

export const getResources = async (courseId?: number): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  try {
    const resources = await fetchResources(courseId);
    return { success: true, data: resources };
  } catch (error) {
    return { success: false, error: 'Failed to fetch resources' };
  }
};

export const changePassword = async (userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const users = await fetchUsers();
    const userIndex = users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    
    // In a real app, this would hash the password
    // Update mustResetPassword flag
    users[userIndex].mustResetPassword = false;
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to change password' 
    };
  }
};

export const deleteUser = async (id: number): Promise<{ success: boolean; error?: string }> => {
  try {
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete user' 
    };
  }
};

// Student Batch Management
export const enrollStudentToBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if student already enrolled
    // In a real app, this would check the database
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to enroll student' 
    };
  }
};

export const unenrollStudentFromBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unenroll student' 
    };
  }
};

// Student Course Management
export const enrollStudentToCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to enroll student to course' 
    };
  }
};

export const unenrollStudentFromCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to unenroll student from course' 
    };
  }
};
