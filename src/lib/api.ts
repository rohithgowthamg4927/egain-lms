
import { CourseCategory, Level, Course, User, Role, Batch, Resource } from '@/lib/types';

// Mock API functions to simulate backend calls

// Generic fetch function (simulating API call)
const apiCall = <T>(data: T): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, 500);
  });
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
  return apiCall(categories);
};

// Users API
export const fetchUsers = async (role?: Role): Promise<User[]> => {
  const users: User[] = [
    {
      id: 1,
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: Role.ADMIN,
      photoUrl: 'https://i.pravatar.cc/150?img=1',
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 2,
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: Role.INSTRUCTOR,
      photoUrl: 'https://i.pravatar.cc/150?img=2',
      createdAt: new Date('2023-02-15'),
    },
    {
      id: 3,
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      role: Role.STUDENT,
      photoUrl: 'https://i.pravatar.cc/150?img=3',
      createdAt: new Date('2023-03-20'),
    },
    {
      id: 4,
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      role: Role.INSTRUCTOR,
      photoUrl: 'https://i.pravatar.cc/150?img=4',
      createdAt: new Date('2023-02-10'),
    },
    {
      id: 5,
      fullName: 'Robert Brown',
      email: 'robert@example.com',
      role: Role.STUDENT,
      photoUrl: 'https://i.pravatar.cc/150?img=5',
      createdAt: new Date('2023-04-05'),
    },
  ];

  if (role) {
    return apiCall(users.filter(user => user.role === role));
  }
  return apiCall(users);
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

  return apiCall(courses);
};

// Fetch a single course by ID
export const fetchCourseById = async (id: number): Promise<Course | null> => {
  const courses = await fetchCourses();
  const course = courses.find(course => course.id === id) || null;
  return apiCall(course);
};

// Batches API
export const fetchBatches = async (): Promise<Batch[]> => {
  const batches: Batch[] = [
    {
      id: 1,
      batchName: 'React - Morning Batch',
      courseId: 1,
      instructorId: 2,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-08-01'),
      students: 25,
    },
    {
      id: 2,
      batchName: 'React - Weekend Batch',
      courseId: 1,
      instructorId: 2,
      startDate: new Date('2023-06-15'),
      endDate: new Date('2023-08-15'),
      students: 30,
    },
    {
      id: 3,
      batchName: 'JavaScript Advanced - Evening',
      courseId: 2,
      instructorId: 2,
      startDate: new Date('2023-07-01'),
      endDate: new Date('2023-09-01'),
      students: 20,
    },
    {
      id: 4,
      batchName: 'Flutter - Morning Batch',
      courseId: 3,
      instructorId: 4,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-08-01'),
      students: 35,
    },
    {
      id: 5,
      batchName: 'Python for Data Science - Weekend',
      courseId: 4,
      instructorId: 4,
      startDate: new Date('2023-07-15'),
      endDate: new Date('2023-09-15'),
      students: 25,
    },
  ];

  return apiCall(batches);
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
    return apiCall(resources.filter(resource => resource.courseId === courseId));
  }
  return apiCall(resources);
};

// Authentication API
export const login = async (email: string, password: string): Promise<User | null> => {
  const users = await fetchUsers();
  // Simple mock auth - in real app would check password hash
  const user = users.find(u => u.email === email);
  
  if (user && password.length > 0) {
    return apiCall(user);
  }
  
  return apiCall(null);
};
