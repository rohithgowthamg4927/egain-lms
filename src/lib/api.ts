
import { CourseCategory, Level, Course, User, Role, Batch, Resource, DashboardMetrics, Schedule } from '@/lib/types';

// Base API URL - Use environment variable with fallback to localhost
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
  // Get the user from localStorage if available
  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      return { success: true, data: user };
    } catch (e) {
      console.error('Error parsing user from localStorage', e);
    }
  }
  
  // Fall back to API call
  return apiFetch<User>('/users/current');
};

export const login = async (email: string, password: string, role: Role): Promise<{ success: boolean; data?: { user: User; token: string }; error?: string }> => {
  console.log("Calling login API with:", { email, role });
  const response = await apiFetch<{ user: User; token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  });
  
  if (response.success && response.data) {
    // Store the user in localStorage
    localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    localStorage.setItem('authToken', response.data.token);
  }
  
  return response;
};

export const logout = async (): Promise<{ success: boolean }> => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  return { success: true };
};

// User Management API
export const createUser = async (userData: Partial<User>): Promise<{ success: boolean; data?: User; error?: string }> => {
  return apiFetch<User>('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const updateUser = async (userId: number, userData: Partial<User>): Promise<{ success: boolean; data?: User; error?: string }> => {
  return apiFetch<User>(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

// Get a specific user by ID
export const getUserById = async (userId: number): Promise<{ success: boolean; data?: { user: User; courses: Course[] }; error?: string }> => {
  return apiFetch<{ user: User; courses: Course[] }>(`/users/${userId}`);
};

// Users API
export const getUsers = async (role?: Role): Promise<{ success: boolean; data?: User[]; error?: string }> => {
  const endpoint = role ? `/users?role=${role}` : '/users';
  return apiFetch<User[]>(endpoint);
};

// Course Categories API
export const getCategories = async (): Promise<{ success: boolean; data?: CourseCategory[]; error?: string }> => {
  return apiFetch<CourseCategory[]>('/categories');
};

export const createCategory = async (categoryData: Partial<CourseCategory>): Promise<{ success: boolean; data?: CourseCategory; error?: string }> => {
  return apiFetch<CourseCategory>('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
};

// Courses API
export const getCourses = async (): Promise<{ success: boolean; data?: Course[]; error?: string }> => {
  return apiFetch<Course[]>('/courses');
};

// Fetch a single course by ID
export const getCourseById = async (courseId: number): Promise<{ success: boolean; data?: Course; error?: string }> => {
  return apiFetch<Course>(`/courses/${courseId}`);
};

// Batches API
export const getBatches = async (courseId?: number): Promise<{ success: boolean; data?: Batch[]; error?: string }> => {
  const endpoint = courseId ? `/batches?courseId=${courseId}` : '/batches';
  return apiFetch<Batch[]>(endpoint);
};

// Get a specific batch by ID
export const getBatchById = async (batchId: number): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  return apiFetch<Batch>(`/batches/${batchId}`);
};

// Dashboard metrics
export const getDashboardMetrics = async (): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> => {
  return apiFetch<DashboardMetrics>('/dashboard-metrics');
};

export const createCourse = async (courseData: Partial<Course>): Promise<{ success: boolean; data?: Course; error?: string }> => {
  return apiFetch<Course>('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  });
};

export const createBatch = async (batchData: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  return apiFetch<Batch>('/batches', {
    method: 'POST',
    body: JSON.stringify(batchData),
  });
};

// Schedules API
export const getSchedules = async (batchId?: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  const endpoint = batchId ? `/schedules?batchId=${batchId}` : '/schedules';
  return apiFetch<Schedule[]>(endpoint);
};

export const createSchedule = async (scheduleData: Partial<Schedule>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  return apiFetch<Schedule>('/schedules', {
    method: 'POST',
    body: JSON.stringify(scheduleData),
  });
};

// Resources API
export const getResources = async (courseId?: number): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  const endpoint = courseId ? `/resources?courseId=${courseId}` : '/resources';
  return apiFetch<Resource[]>(endpoint);
};

export const createResource = async (resourceData: Partial<Resource>): Promise<{ success: boolean; data?: Resource; error?: string }> => {
  return apiFetch<Resource>('/resources', {
    method: 'POST',
    body: JSON.stringify(resourceData),
  });
};

export const changePassword = async (userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/users/${userId}/change-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
};

export const deleteUser = async (id: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/users/${id}`, {
    method: 'DELETE',
  });
};

// Student Batch Management
export const enrollStudentToBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch('/student-batches', {
    method: 'POST',
    body: JSON.stringify({ studentId, batchId }),
  });
};

export const unenrollStudentFromBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/student-batches/${studentId}/${batchId}`, {
    method: 'DELETE',
  });
};

// Student Course Management
export const enrollStudentToCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch('/student-courses', {
    method: 'POST',
    body: JSON.stringify({ studentId, courseId }),
  });
};

export const unenrollStudentFromCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  return apiFetch(`/student-courses/${studentId}/${courseId}`, {
    method: 'DELETE',
  });
};
