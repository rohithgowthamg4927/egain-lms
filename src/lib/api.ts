
import { CourseCategory, Level, Course, User, Role, Batch, Resource, DashboardMetrics, Schedule } from '@/lib/types';
import { uploadProfilePicture, uploadCourseThumbnail, uploadClassRecording } from '@/lib/s3-upload';
import { generateRandomPassword } from '@/lib/utils';

// Generic fetch function (simulating API call)
const apiCall = <T>(data: T): Promise<{ success: boolean; data?: T; error?: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, data });
    }, 500);
  });
};

// Authentication API
export const getCurrentUser = async (): Promise<{ success: boolean; data?: User; error?: string }> => {
  // In a real app, this would check the session/token
  // For demo, just return a mock user
  const users = await fetchUsers();
  return apiCall(users[0]); // Mock admin user
};

export const login = async (email: string, password: string, role: Role): Promise<{ success: boolean; data?: { user: User; token: string }; error?: string }> => {
  try {
    const users = await fetchUsers();
    const user = users.find(u => u.email === email && u.role === role);
    
    if (user && password.length > 0) {
      return {
        success: true,
        data: {
          user,
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
    
    // Create new user with generated ID
    const newUser: User = {
      id: Date.now(),
      fullName: userData.fullName || '',
      email: userData.email || '',
      role: userData.role || Role.STUDENT,
      photoUrl,
      phone: userData.phone,
      bio: userData.bio,
      isFirstLogin: true,
      password,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return { success: true, data: newUser };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create user' 
    };
  }
};

export const updateUser = async (id: number, userData: Partial<User>, profilePicture?: File): Promise<{ success: boolean; data?: User; error?: string }> => {
  try {
    const users = await fetchUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    
    // Upload profile picture if provided
    if (profilePicture) {
      userData.photoUrl = await uploadProfilePicture(profilePicture, id);
    }
    
    // Update user
    const updatedUser: User = {
      ...users[userIndex],
      ...userData,
      updatedAt: new Date()
    };
    
    return { success: true, data: updatedUser };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user' 
    };
  }
};

export const changePassword = async (userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const users = await fetchUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    
    // In a real app, this would hash the password
    // Update isFirstLogin flag
    users[userIndex].isFirstLogin = false;
    
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

// Course Categories API
export const fetchCourseCategories = async (): Promise<CourseCategory[]> => {
  const categories: CourseCategory[] = [
    { id: 1, categoryName: 'Web Development' },
    { id: 2, categoryName: 'Mobile Development' },
    { id: 3, categoryName: 'Data Science' },
    { id: 4, categoryName: 'DevOps' },
    { id: 5, categoryName: 'UI/UX Design' },
  ];
  return categories;
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
  try {
    const newCategory: CourseCategory = {
      id: Date.now(),
      categoryName: categoryData.categoryName || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return { success: true, data: newCategory };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create category' 
    };
  }
};

// Users API
export const fetchUsers = async (role?: Role): Promise<User[]> => {
  const users: User[] = [
    {
      id: 1,
      fullName: 'Admin User',
      email: 'admin@lms.com',
      role: Role.ADMIN,
      photoUrl: 'https://i.pravatar.cc/150?img=1',
      createdAt: new Date('2023-01-01'),
      isFirstLogin: false,
      password: 'Admin@123'
    },
    {
      id: 2,
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: Role.INSTRUCTOR,
      photoUrl: 'https://i.pravatar.cc/150?img=2',
      createdAt: new Date('2023-02-15'),
      isFirstLogin: true,
      password: 'Temp1234'
    },
    {
      id: 3,
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: Role.STUDENT,
      photoUrl: 'https://i.pravatar.cc/150?img=3',
      createdAt: new Date('2023-03-20'),
      isFirstLogin: true,
      password: 'Temp5678'
    },
    {
      id: 4,
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      role: Role.INSTRUCTOR,
      photoUrl: 'https://i.pravatar.cc/150?img=4',
      createdAt: new Date('2023-02-10'),
      isFirstLogin: true,
      password: 'Temp4321'
    },
    {
      id: 5,
      fullName: 'Robert Brown',
      email: 'robert@example.com',
      role: Role.STUDENT,
      photoUrl: 'https://i.pravatar.cc/150?img=5',
      createdAt: new Date('2023-04-05'),
      isFirstLogin: true,
      password: 'Temp8765'
    },
  ];

  if (role) {
    return users.filter(user => user.role === role);
  }
  return users;
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

// Courses API
export const fetchCourses = async (): Promise<Course[]> => {
  const courses: Course[] = [
    {
      id: 1,
      courseName: 'Introduction to React',
      description: 'Learn the basics of React, hooks, context API and build real-world applications',
      courseLevel: Level.BEGINNER,
      categoryId: 1,
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      students: 120,
      averageRating: 4.7,
      batches: 3,
      durationHours: 18,
      createdAt: new Date('2023-01-10'),
      createdBy: 2,
    },
    {
      id: 2,
      courseName: 'Advanced JavaScript Patterns',
      description: 'Deep dive into advanced JavaScript design patterns, asynchronous programming, and performance optimization',
      courseLevel: Level.ADVANCED,
      categoryId: 1,
      thumbnailUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      students: 85,
      averageRating: 4.9,
      batches: 2,
      durationHours: 24,
      createdAt: new Date('2023-02-05'),
      createdBy: 2,
    },
    {
      id: 3,
      courseName: 'Flutter for Beginners',
      description: 'Start your journey in mobile app development with Flutter and Dart',
      courseLevel: Level.BEGINNER,
      categoryId: 2,
      thumbnailUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      students: 200,
      averageRating: 4.5,
      batches: 4,
      durationHours: 20,
      createdAt: new Date('2023-01-25'),
      createdBy: 4,
    },
    {
      id: 4,
      courseName: 'Python for Data Science',
      description: 'Learn Python programming with a focus on data analysis, visualization, and machine learning basics',
      courseLevel: Level.INTERMEDIATE,
      categoryId: 3,
      thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      students: 150,
      averageRating: 4.6,
      batches: 3,
      durationHours: 22,
      createdAt: new Date('2023-03-15'),
      createdBy: 4,
    },
    {
      id: 5,
      courseName: 'Docker Essentials',
      description: 'Get started with containerization using Docker and understand container orchestration',
      courseLevel: Level.BEGINNER,
      categoryId: 4,
      thumbnailUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      students: 95,
      averageRating: 4.4,
      batches: 2,
      durationHours: 15,
      createdAt: new Date('2023-04-10'),
      createdBy: 2,
    },
  ];

  // Enrich with category data
  const categories = await fetchCourseCategories();
  return courses.map(course => ({
    ...course,
    category: categories.find(c => c.id === course.categoryId)
  })) as Course[];
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

export const createCourse = async (courseData: Partial<Course>, thumbnail?: File): Promise<{ success: boolean; data?: Course; error?: string }> => {
  try {
    // Upload thumbnail if provided
    let thumbnailUrl = courseData.thumbnailUrl;
    if (thumbnail) {
      thumbnailUrl = await uploadCourseThumbnail(thumbnail, Date.now());
    }
    
    // Create new course with generated ID
    const newCourse: Course = {
      id: Date.now(),
      courseName: courseData.courseName || '',
      description: courseData.description,
      courseLevel: courseData.courseLevel || Level.BEGINNER,
      categoryId: courseData.categoryId || 1,
      thumbnailUrl,
      students: 0,
      batches: 0,
      createdAt: new Date(),
      createdBy: courseData.createdBy || 1,
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

// Batches API
export const fetchBatches = async (courseId?: number): Promise<Batch[]> => {
  const courses = await fetchCourses();
  const users = await fetchUsers();
  
  const batches: Batch[] = [
    {
      id: 1,
      batchName: 'React - Morning Batch',
      courseId: 1,
      instructorId: 2,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-08-01'),
      students: 25,
      createdAt: new Date('2023-05-15'),
    },
    {
      id: 2,
      batchName: 'React - Weekend Batch',
      courseId: 1,
      instructorId: 2,
      startDate: new Date('2023-06-15'),
      endDate: new Date('2023-08-15'),
      students: 30,
      createdAt: new Date('2023-05-20'),
    },
    {
      id: 3,
      batchName: 'JavaScript Advanced - Evening',
      courseId: 2,
      instructorId: 2,
      startDate: new Date('2023-07-01'),
      endDate: new Date('2023-09-01'),
      students: 20,
      createdAt: new Date('2023-06-01'),
    },
    {
      id: 4,
      batchName: 'Flutter - Morning Batch',
      courseId: 3,
      instructorId: 4,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-08-01'),
      students: 35,
      createdAt: new Date('2023-05-15'),
    },
    {
      id: 5,
      batchName: 'Python for Data Science - Weekend',
      courseId: 4,
      instructorId: 4,
      startDate: new Date('2023-07-15'),
      endDate: new Date('2023-09-15'),
      students: 25,
      createdAt: new Date('2023-06-10'),
    },
  ];

  // Add additional properties to simulate joined data
  const enrichedBatches = batches.map(batch => ({
    ...batch,
    course: courses.find(c => c.id === batch.courseId),
    instructor: users.find(u => u.id === batch.instructorId),
    studentsCount: batch.students,
  }));
  
  if (courseId) {
    return enrichedBatches.filter(batch => batch.courseId === courseId);
  }
  
  return enrichedBatches as any;
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
    const newBatch: Batch = {
      id: Date.now(),
      batchName: batchData.batchName || '',
      courseId: batchData.courseId || 0,
      instructorId: batchData.instructorId || 0,
      startDate: batchData.startDate || new Date(),
      endDate: batchData.endDate || new Date(),
      students: 0,
      createdAt: new Date(),
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
      batchId: 1,
      startTime: new Date('2023-06-05T17:00:00'),
      endTime: new Date('2023-06-05T18:30:00'),
      topic: 'Introduction to React Basics',
      platform: 'zoom',
      link: 'https://zoom.us/j/123456789',
      createdAt: new Date('2023-05-20'),
      updatedAt: new Date('2023-05-20'),
    },
    {
      id: 2,
      batchId: 1,
      startTime: new Date('2023-06-07T17:00:00'),
      endTime: new Date('2023-06-07T18:30:00'),
      topic: 'Components and Props',
      platform: 'zoom',
      link: 'https://zoom.us/j/123456789',
      createdAt: new Date('2023-05-20'),
      updatedAt: new Date('2023-05-20'),
    },
    {
      id: 3,
      batchId: 2,
      startTime: new Date('2023-06-10T10:00:00'),
      endTime: new Date('2023-06-10T11:30:00'),
      topic: 'React Weekend Workshop',
      platform: 'google-meet',
      link: 'https://meet.google.com/abc-defg-hij',
      createdAt: new Date('2023-05-25'),
      updatedAt: new Date('2023-05-25'),
    },
    {
      id: 4,
      batchId: 3,
      startTime: new Date('2023-07-03T18:00:00'),
      endTime: new Date('2023-07-03T19:30:00'),
      topic: 'JavaScript Design Patterns',
      platform: 'zoom',
      link: 'https://zoom.us/j/987654321',
      createdAt: new Date('2023-06-15'),
      updatedAt: new Date('2023-06-15'),
    },
    {
      id: 5,
      batchId: 4,
      startTime: new Date('2023-06-05T09:00:00'),
      endTime: new Date('2023-06-05T10:30:00'),
      topic: 'Flutter UI Basics',
      platform: 'zoom',
      link: 'https://zoom.us/j/567891234',
      createdAt: new Date('2023-05-20'),
      updatedAt: new Date('2023-05-20'),
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
    const newSchedule: Schedule = {
      id: Date.now(),
      batchId: scheduleData.batchId || 0,
      startTime: scheduleData.startTime || new Date(),
      endTime: scheduleData.endTime || new Date(),
      topic: scheduleData.topic,
      platform: scheduleData.platform || 'zoom',
      link: scheduleData.link,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      title: 'React Fundamentals Slides',
      description: 'Slide deck covering React basics and component lifecycle',
      fileUrl: 'https://example.com/resources/react-slides.pdf',
      fileType: 'document',
      courseId: 1,
      createdAt: new Date('2023-05-15'),
    },
    {
      id: 2,
      title: 'React Hooks Demo Code',
      description: 'Example code demonstrating React hooks usage',
      fileUrl: 'https://github.com/example/react-hooks-demo',
      fileType: 'code',
      courseId: 1,
      createdAt: new Date('2023-05-20'),
    },
    {
      id: 3,
      title: 'Advanced JavaScript Patterns Handbook',
      description: 'Comprehensive guide to JS design patterns',
      fileUrl: 'https://example.com/resources/js-patterns.pdf',
      fileType: 'document',
      courseId: 2,
      createdAt: new Date('2023-05-25'),
    },
    {
      id: 4,
      title: 'Flutter Setup Guide',
      description: 'Step-by-step guide for setting up Flutter development environment',
      fileUrl: 'https://example.com/resources/flutter-setup.pdf',
      fileType: 'document',
      courseId: 3,
      createdAt: new Date('2023-05-10'),
    },
    {
      id: 5,
      title: 'Python Data Analysis Code Samples',
      description: 'Sample code for data analysis with pandas and matplotlib',
      fileUrl: 'https://github.com/example/python-data-analysis',
      fileType: 'code',
      courseId: 4,
      createdAt: new Date('2023-06-05'),
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

// Dashboard metrics
export const getDashboardMetrics = async (): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> => {
  try {
    const users = await fetchUsers();
    const courses = await fetchCourses();
    const batches = await fetchBatches();
    
    const students = users.filter(user => user.role === Role.STUDENT);
    const instructors = users.filter(user => user.role === Role.INSTRUCTOR);
    
    const metrics: DashboardMetrics = {
      totalStudents: students.length,
      totalInstructors: instructors.length,
      totalCourses: courses.length,
      totalBatches: batches.length,
      activeStudents: Math.floor(students.length * 0.8), // Mock data: 80% of students are active
      coursesPerCategory: [
        { categoryName: 'Web Development', count: 2 },
        { categoryName: 'Mobile Development', count: 1 },
        { categoryName: 'Data Science', count: 1 },
        { categoryName: 'DevOps', count: 1 },
      ],
      recentEnrollments: [
        { studentName: 'John Doe', courseName: 'Introduction to React', date: new Date('2023-05-25') },
        { studentName: 'Robert Brown', courseName: 'Flutter for Beginners', date: new Date('2023-05-20') },
        { studentName: 'John Doe', courseName: 'Python for Data Science', date: new Date('2023-05-15') },
        { studentName: 'Robert Brown', courseName: 'Docker Essentials', date: new Date('2023-05-10') },
      ]
    };
    
    return { success: true, data: metrics };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard metrics' 
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
