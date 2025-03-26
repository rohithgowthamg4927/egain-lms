import { CourseCategory, Level, Course, User, Role, Batch, Resource, DashboardMetrics, Schedule } from '@/lib/types';
import { uploadProfilePicture, uploadCourseThumbnail, uploadClassRecording } from '@/lib/s3-upload';
import { generateRandomPassword } from '@/lib/utils';
import { dateToString } from '@/lib/utils/date-helpers';
import { convertDatesToStrings, mapApiUser, mapApiCourse, mapApiCategory, mapApiBatch } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Sample mock data for browser environment
const mockData = {
  users: [
    {
      userId: 1,
      fullName: 'Admin User',
      email: 'admin@lms.com',
      role: Role.admin,
      profilePicture: { 
        fileUrl: 'https://i.pravatar.cc/150?img=1'
      },
      mustResetPassword: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  courses: [
    {
      courseId: 1,
      courseName: 'React Fundamentals',
      courseLevel: Level.beginner,
      categoryId: 1,
      description: 'Learn the basics of React',
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      duration: 20,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      students: 15,
      batches: 2,
      averageRating: 4.5
    }
  ],
  categories: [
    {
      categoryId: 1,
      categoryName: 'Web Development',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  batches: [
    {
      batchId: 1,
      batchName: 'Morning Batch',
      courseId: 1,
      instructorId: 2,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      students: 12,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

// Generic fetch function with error handling and mock data fallback
const apiCall = async <T>(
  action: () => Promise<T>,
  mockResult?: T
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    // If we're in a browser environment and have mock data, use it
    if (isBrowser && mockResult) {
      console.log('Using mock data in browser environment');
      return { success: true, data: mockResult };
    }
    
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
  try {
    if (isBrowser) {
      // In browser, return mock data
      return { 
        success: true, 
        data: mapApiUser(mockData.users[0]) 
      };
    }
    
    const users = await prisma.user.findMany({
      where: { role: 'admin' },
      take: 1,
      include: {
        profilePicture: true
      }
    });
    
    if (users.length > 0) {
      return { success: true, data: mapApiUser(users[0]) };
    }
    
    return { success: false, error: 'No user found' };
  } catch (error) {
    console.error("Error fetching current user:", error);
    return { success: false, error: 'Failed to fetch current user' };
  }
};

export const login = async (email: string, password: string, role: Role): Promise<{ success: boolean; data?: { user: User; token: string }; error?: string }> => {
  try {
    if (isBrowser) {
      // In browser, return mock data
      return { 
        success: true, 
        data: {
          user: mapApiUser(mockData.users[0]),
          token: 'mock-jwt-token'
        }
      };
    }
    
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

// User Management API
export const createUser = async (userData: Partial<User>, profilePicture?: File): Promise<{ success: boolean; data?: User; error?: string }> => {
  return apiCall(async () => {
    // Generate random password
    const password = generateRandomPassword(8);
    
    // Upload profile picture if provided
    let photoUrl = userData.photoUrl;
    if (profilePicture) {
      photoUrl = await uploadProfilePicture(profilePicture, Date.now());
    }
    
    // Create new user in the database
    const newUser = await prisma.user.create({
      data: {
        fullName: userData.fullName || '',
        email: userData.email || '',
        role: userData.role || Role.student,
        phoneNumber: userData.phoneNumber,
        password, // In a real app, hash this password
        mustResetPassword: true,
        // Create profile picture if photoUrl is provided
        ...(photoUrl && {
          profilePicture: {
            create: {
              fileName: profilePicture?.name || 'profile.jpg',
              fileUrl: photoUrl,
              fileType: profilePicture?.type || 'image/jpeg',
              fileSize: profilePicture?.size || 0
            }
          }
        })
      },
      include: {
        profilePicture: true
      }
    });
    
    return mapApiUser(newUser);
  });
};

export const updateUser = async (userId: number, userData: Partial<User>, profilePicture?: File): Promise<{ success: boolean; data?: User; error?: string }> => {
  return apiCall(async () => {
    // Upload profile picture if provided
    let photoUrl = userData.photoUrl;
    if (profilePicture) {
      photoUrl = await uploadProfilePicture(profilePicture, userId);
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        ...(userData.fullName && { fullName: userData.fullName }),
        ...(userData.email && { email: userData.email }),
        ...(userData.phoneNumber && { phoneNumber: userData.phoneNumber }),
        ...(userData.bio && { bio: userData.bio }),
        ...(photoUrl && {
          profilePicture: {
            upsert: {
              create: {
                fileName: profilePicture?.name || 'profile.jpg',
                fileUrl: photoUrl,
                fileType: profilePicture?.type || 'image/jpeg',
                fileSize: profilePicture?.size || 0
              },
              update: {
                fileName: profilePicture?.name || 'profile.jpg',
                fileUrl: photoUrl,
                fileType: profilePicture?.type || 'image/jpeg',
                fileSize: profilePicture?.size || 0
              }
            }
          }
        })
      },
      include: {
        profilePicture: true
      }
    });
    
    return mapApiUser(updatedUser);
  });
};

export const changePassword = async (userId: number, newPassword: string): Promise<{ success: boolean; error?: string }> => {
  return apiCall(async () => {
    await prisma.user.update({
      where: { userId },
      data: {
        password: newPassword, // In a real app, hash this password
        mustResetPassword: false
      }
    });
    
    return true;
  });
};

export const deleteUser = async (id: number): Promise<{ success: boolean; error?: string }> => {
  return apiCall(async () => {
    await prisma.user.delete({
      where: { userId: id }
    });
    
    return true;
  });
};

// Course Categories API
export const fetchCourseCategories = async (): Promise<CourseCategory[]> => {
  const categories = await prisma.courseCategory.findMany();
  return categories.map(mapApiCategory);
};

export const getCategories = async (): Promise<{ success: boolean; data?: CourseCategory[]; error?: string }> => {
  return apiCall(fetchCourseCategories);
};

export const createCategory = async (categoryData: Partial<CourseCategory>): Promise<{ success: boolean; data?: CourseCategory; error?: string }> => {
  return apiCall(async () => {
    const newCategory = await prisma.courseCategory.create({
      data: {
        categoryName: categoryData.categoryName || ''
      }
    });
    
    return mapApiCategory(newCategory);
  });
};

// Users API
export const fetchUsers = async (role?: Role): Promise<User[]> => {
  const users = await prisma.user.findMany({
    where: role ? { role } : {},
    include: {
      profilePicture: true
    }
  });
  
  return users.map(mapApiUser);
};

// Alias for fetchUsers to match usage in components
export const getUsers = async (role?: Role): Promise<{ success: boolean; data?: User[]; error?: string }> => {
  return apiCall(() => fetchUsers(role));
};

// Courses API
export const fetchCourses = async (): Promise<Course[]> => {
  const courses = await prisma.course.findMany({
    include: {
      category: true,
      batches: true,
      reviews: true,
      studentCourses: true
    }
  });
  
  return courses.map(course => {
    const mappedCourse = mapApiCourse(course);
    // Add calculated fields
    mappedCourse.students = course.studentCourses?.length || 0;
    mappedCourse.batches = course.batches?.length || 0;
    mappedCourse.averageRating = course.reviews?.length 
      ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length 
      : 0;
    
    return mappedCourse;
  });
};

// Alias for fetchCourses to match usage in components
export const getCourses = async (): Promise<{ success: boolean; data?: Course[]; error?: string }> => {
  return apiCall(fetchCourses);
};

export const createCourse = async (courseData: Partial<Course>, thumbnail?: File): Promise<{ success: boolean; data?: Course; error?: string }> => {
  return apiCall(async () => {
    // Upload thumbnail if provided
    let thumbnailUrl = courseData.thumbnailUrl;
    if (thumbnail) {
      thumbnailUrl = await uploadCourseThumbnail(thumbnail, Date.now());
    }
    
    // Create new course
    const newCourse = await prisma.course.create({
      data: {
        courseName: courseData.courseName || '',
        description: courseData.description || '',
        courseLevel: courseData.courseLevel || Level.beginner,
        categoryId: courseData.categoryId || 1,
        thumbnailUrl,
        duration: courseData.durationHours || 0,
        isPublished: courseData.isPublished || false
      },
      include: {
        category: true
      }
    });
    
    return mapApiCourse(newCourse);
  });
};

// Fetch a single course by ID
export const fetchCourseById = async (id: number): Promise<Course | null> => {
  const course = await prisma.course.findUnique({
    where: { courseId: id },
    include: {
      category: true,
      batches: true,
      reviews: true,
      studentCourses: true
    }
  });
  
  if (!course) return null;
  
  const mappedCourse = mapApiCourse(course);
  // Add calculated fields
  mappedCourse.students = course.studentCourses?.length || 0;
  mappedCourse.batches = course.batches?.length || 0;
  mappedCourse.averageRating = course.reviews?.length 
    ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length 
    : 0;
  
  return mappedCourse;
};

// Batches API
export const fetchBatches = async (courseId?: number): Promise<Batch[]> => {
  const batches = await prisma.batch.findMany({
    where: courseId ? { courseId } : {},
    include: {
      course: {
        include: { category: true }
      },
      instructor: {
        include: { profilePicture: true }
      },
      students: true
    }
  });
  
  return batches.map(batch => {
    const mappedBatch = mapApiBatch(batch);
    mappedBatch.students = batch.students?.length || 0;
    mappedBatch.studentsCount = batch.students?.length || 0;
    
    return mappedBatch;
  });
};

// Alias for fetchBatches to match usage in components
export const getBatches = async (courseId?: number): Promise<{ success: boolean; data?: Batch[]; error?: string }> => {
  return apiCall(() => fetchBatches(courseId));
};

export const createBatch = async (batchData: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> => {
  return apiCall(async () => {
    // Check if batch with same name already exists for the course
    const existingBatch = await prisma.batch.findFirst({
      where: {
        courseId: batchData.courseId,
        batchName: batchData.batchName
      }
    });
    
    if (existingBatch) {
      throw new Error(`A batch with name "${batchData.batchName}" already exists for this course`);
    }
    
    // Create new batch
    const newBatch = await prisma.batch.create({
      data: {
        batchName: batchData.batchName || '',
        courseId: batchData.courseId || 0,
        instructorId: batchData.instructorId || 0,
        startDate: new Date(batchData.startDate || new Date()),
        endDate: new Date(batchData.endDate || new Date())
      },
      include: {
        course: {
          include: { category: true }
        },
        instructor: {
          include: { profilePicture: true }
        },
        students: true
      }
    });
    
    const mappedBatch = mapApiBatch(newBatch);
    mappedBatch.students = 0;
    mappedBatch.studentsCount = 0;
    
    return mappedBatch;
  });
};

// Schedules API
export const fetchSchedules = async (batchId?: number): Promise<Schedule[]> => {
  const schedules = await prisma.schedule.findMany({
    where: batchId ? { batchId } : {}
  });
  
  return schedules.map(schedule => ({
    scheduleId: schedule.scheduleId,
    id: schedule.scheduleId,
    batchId: schedule.batchId,
    dayOfWeek: schedule.dayOfWeek,
    startTime: dateToString(schedule.startTime),
    endTime: dateToString(schedule.endTime),
    createdAt: dateToString(schedule.createdAt),
    updatedAt: dateToString(schedule.updatedAt),
    topic: '', // These fields aren't in the schema but are in the type
    platform: '',
    link: ''
  }));
};

export const getSchedules = async (batchId?: number): Promise<{ success: boolean; data?: Schedule[]; error?: string }> => {
  return apiCall(() => fetchSchedules(batchId));
};

export const createSchedule = async (scheduleData: Partial<Schedule>): Promise<{ success: boolean; data?: Schedule; error?: string }> => {
  return apiCall(async () => {
    const newSchedule = await prisma.schedule.create({
      data: {
        batchId: scheduleData.batchId || 0,
        dayOfWeek: scheduleData.dayOfWeek || 1,
        startTime: new Date(scheduleData.startTime || new Date()),
        endTime: new Date(scheduleData.endTime || new Date())
      }
    });
    
    return {
      scheduleId: newSchedule.scheduleId,
      id: newSchedule.scheduleId,
      batchId: newSchedule.batchId,
      dayOfWeek: newSchedule.dayOfWeek,
      startTime: dateToString(newSchedule.startTime),
      endTime: dateToString(newSchedule.endTime),
      createdAt: dateToString(newSchedule.createdAt),
      updatedAt: dateToString(newSchedule.updatedAt),
      topic: scheduleData.topic || '',
      platform: scheduleData.platform || 'zoom',
      link: scheduleData.link || ''
    };
  });
};

export const uploadScheduleRecording = async (
  file: File,
  scheduleId: number,
  batchId: number
): Promise<{ success: boolean; data?: { fileUrl: string }; error?: string }> => {
  return apiCall(async () => {
    const fileUrl = await uploadClassRecording(file, batchId, scheduleId);
    return { fileUrl };
  });
};

// Resources API
export const fetchResources = async (courseId?: number): Promise<Resource[]> => {
  const resources = await prisma.resource.findMany({
    where: courseId ? { courseId } : {}
  });
  
  return resources.map(resource => ({
    resourceId: resource.resourceId,
    id: resource.resourceId,
    courseId: resource.courseId,
    title: resource.title,
    type: resource.type,
    url: resource.url,
    description: resource.description || '',
    createdAt: dateToString(resource.createdAt),
    updatedAt: dateToString(resource.updatedAt)
  }));
};

export const getResources = async (courseId?: number): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  return apiCall(() => fetchResources(courseId));
};

// Dashboard metrics
export const getDashboardMetrics = async (): Promise<{ success: boolean; data?: DashboardMetrics; error?: string }> => {
  return apiCall(async () => {
    const [
      studentCount, 
      instructorCount, 
      courseCount, 
      batchCount,
      recentUsers,
      upcomingBatches
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.student }}),
      prisma.user.count({ where: { role: Role.instructor }}),
      prisma.course.count(),
      prisma.batch.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { profilePicture: true }
      }),
      prisma.batch.findMany({
        where: {
          startDate: { gte: new Date() }
        },
        orderBy: { startDate: 'asc' },
        take: 5,
        include: {
          course: true,
          instructor: { include: { profilePicture: true } }
        }
      })
    ]);
    
    // Get course categories with counts
    const categories = await prisma.courseCategory.findMany({
      include: {
        courses: {
          select: { courseId: true }
        }
      }
    });
    
    const coursesPerCategory = categories.map(cat => ({
      categoryName: cat.categoryName,
      count: cat.courses.length
    }));
    
    // Get recent enrollments
    const recentEnrollments = await prisma.studentCourse.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: {
        student: true,
        course: true
      }
    });
    
    const mappedEnrollments = recentEnrollments.map(enrollment => ({
      studentName: enrollment.student.fullName,
      courseName: enrollment.course.courseName,
      date: enrollment.createdAt
    }));
    
    const metrics: DashboardMetrics = {
      totalStudents: studentCount,
      totalInstructors: instructorCount,
      totalCourses: courseCount,
      totalBatches: batchCount,
      activeStudents: Math.floor(studentCount * 0.8), // Mock data: 80% of students are active
      coursesPerCategory,
      recentEnrollments: mappedEnrollments,
      recentUsers: recentUsers.map(mapApiUser),
      upcomingBatches: upcomingBatches.map(mapApiBatch)
    };
    
    return metrics;
  });
};

// Student Batch Management
export const enrollStudentToBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiCall(async () => {
    await prisma.studentBatch.create({
      data: {
        studentId,
        batchId
      }
    });
    
    return true;
  });
};

export const unenrollStudentFromBatch = async (studentId: number, batchId: number): Promise<{ success: boolean; error?: string }> => {
  return apiCall(async () => {
    await prisma.studentBatch.deleteMany({
      where: {
        studentId,
        batchId
      }
    });
    
    return true;
  });
};

// Student Course Management
export const enrollStudentToCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  return apiCall(async () => {
    await prisma.studentCourse.create({
      data: {
        studentId,
        courseId
      }
    });
    
    return true;
  });
};

export const unenrollStudentFromCourse = async (studentId: number, courseId: number): Promise<{ success: boolean; error?: string }> => {
  return apiCall(async () => {
    await prisma.studentCourse.deleteMany({
      where: {
        studentId,
        courseId
      }
    });
    
    return true;
  });
};

