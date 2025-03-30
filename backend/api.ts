
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cors());

// Helper function to handle API errors
const handleApiError = (res: express.Response, error: any) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    success: false, 
    error: error instanceof Error ? error.message : 'An unexpected error occurred' 
  });
};

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Database setup endpoint
app.post('/api/setup-database', async (req, res) => {
  try {
    // Example database setup logic
    const adminExists = await prisma.user.findFirst({ where: { role: 'admin' } });
    
    if (!adminExists) {
      await prisma.user.create({ 
        data: { 
          fullName: 'Admin User',
          email: 'admin@lms.com',
          role: 'admin',
          password: 'Admin@123',
          mustResetPassword: false
        } 
      });
    }
    
    res.status(200).json({ success: true, message: 'Database setup completed' });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Users API
app.get('/api/users', async (req, res) => {
  try {
    const role = req.query.role as string | undefined;
    let users;
    
    if (role) {
      users = await prisma.user.findMany({
        where: { role: role as any },
        include: { profilePicture: true }
      });
    } else {
      users = await prisma.user.findMany({
        include: { profilePicture: true }
      });
    }
    
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Current user API
app.get('/api/users/current', async (req, res) => {
  try {
    // In a real app, you'd get this from the JWT token
    // Here we're just returning the first admin for demonstration
    const user = await prisma.user.findFirst({
      where: { role: 'admin' },
      include: { profilePicture: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'No user found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Individual User API
app.get('/api/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { profilePicture: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Get courses for this user based on role
    let courses = [];
    if (user.role === 'student') {
      const studentCourses = await prisma.studentCourse.findMany({
        where: { studentId: userId },
        include: {
          course: {
            include: { category: true }
          }
        }
      });
      courses = studentCourses.map(sc => sc.course);
    } else if (user.role === 'instructor') {
      const instructorCourses = await prisma.instructorCourse.findMany({
        where: { instructorId: userId },
        include: {
          course: {
            include: { category: true }
          }
        }
      });
      courses = instructorCourses.map(ic => ic.course);
    }
    
    res.status(200).json({ 
      success: true, 
      data: { 
        user,
        courses
      } 
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create User API
app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    
    // Check if email is already in use
    const existingUser = await prisma.user.findFirst({ 
      where: { email: userData.email } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already in use' 
      });
    }
    
    // Create the new user with the provided data
    const newUser = await prisma.user.create({
      data: userData
    });
    
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update User API
app.put('/api/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userData = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: userData,
      include: { profilePicture: true }
    });
    
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete User API
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    await prisma.user.delete({
      where: { userId }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Course Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.courseCategory.findMany();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const categoryData = req.body;
    const newCategory = await prisma.courseCategory.create({
      data: categoryData
    });
    
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Courses API
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        category: true,
        reviews: true,
        batches: true,
        studentCourses: true
      }
    });
    
    const enrichedCourses = courses.map(course => ({
      ...course,
      students: course.studentCourses.length,
      batches: course.batches.length,
      averageRating: course.reviews.length > 0 
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length 
        : null
    }));
    
    res.status(200).json({ success: true, data: enrichedCourses });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get a specific course
app.get('/api/courses/:courseId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    
    const course = await prisma.course.findUnique({
      where: { courseId },
      include: {
        category: true,
        reviews: true,
        batches: true,
        studentCourses: true,
        resources: true
      }
    });
    
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    
    const enrichedCourse = {
      ...course,
      students: course.studentCourses.length,
      batches: course.batches.length,
      averageRating: course.reviews.length > 0 
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length 
        : null
    };
    
    res.status(200).json({ success: true, data: enrichedCourse });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a course
app.post('/api/courses', async (req, res) => {
  try {
    const courseData = req.body;
    const newCourse = await prisma.course.create({
      data: courseData,
      include: { category: true }
    });
    
    res.status(201).json({ success: true, data: newCourse });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Batches API
app.get('/api/batches', async (req, res) => {
  try {
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    
    const batches = await prisma.batch.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        course: {
          include: { category: true }
        },
        instructor: true,
        students: true
      }
    });
    
    const enrichedBatches = batches.map(batch => ({
      ...batch,
      students: batch.students.length,
      studentsCount: batch.students.length
    }));
    
    res.status(200).json({ success: true, data: enrichedBatches });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get a specific batch
app.get('/api/batches/:batchId', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    
    const batch = await prisma.batch.findUnique({
      where: { batchId },
      include: {
        course: {
          include: { category: true }
        },
        instructor: true,
        students: true,
        schedules: true
      }
    });
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    
    const enrichedBatch = {
      ...batch,
      students: batch.students.length,
      studentsCount: batch.students.length
    };
    
    res.status(200).json({ success: true, data: enrichedBatch });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a batch
app.post('/api/batches', async (req, res) => {
  try {
    const batchData = req.body;
    const newBatch = await prisma.batch.create({
      data: batchData,
      include: {
        course: true,
        instructor: true
      }
    });
    
    res.status(201).json({ success: true, data: newBatch });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Login API
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    const user = await prisma.user.findFirst({
      where: {
        email,
        role: role as any
      },
      include: { profilePicture: true }
    });
    
    if (user && password === user.password) {
      res.status(200).json({
        success: true,
        data: {
          user,
          token: 'mock-jwt-token' // In a real app, you'd generate a JWT here
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    handleApiError(res, error);
  }
});

// Dashboard Metrics API
app.get('/api/dashboard-metrics', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const students = users.filter(user => user.role === 'student');
    const instructors = users.filter(user => user.role === 'instructor');
    
    const courses = await prisma.course.findMany({
      include: { category: true }
    });
    
    const batches = await prisma.batch.findMany({
      include: {
        course: true,
        instructor: true,
        students: true
      },
      orderBy: { startDate: 'asc' }
    });
    
    // Get category counts
    const categoryIds = courses.map(course => course.categoryId);
    const categoryCount = new Map();
    
    for (const id of categoryIds) {
      categoryCount.set(id, (categoryCount.get(id) || 0) + 1);
    }
    
    const categories = await prisma.courseCategory.findMany({
      where: { categoryId: { in: Array.from(categoryCount.keys()) } }
    });
    
    const coursesPerCategory = categories.map(category => ({
      categoryName: category.categoryName,
      count: categoryCount.get(category.categoryId) || 0
    }));
    
    // Get actual enrollments
    const studentCourses = await prisma.studentCourse.findMany({
      include: {
        student: true,
        course: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    const recentEnrollments = studentCourses.map(enrollment => ({
      studentName: enrollment.student.fullName,
      courseName: enrollment.course.courseName,
      date: enrollment.createdAt
    }));
    
    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    
    const upcomingBatches = batches
      .filter(batch => new Date(batch.startDate) > new Date())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
    
    const metrics = {
      totalStudents: students.length,
      totalInstructors: instructors.length,
      totalCourses: courses.length,
      totalBatches: batches.length,
      activeStudents: batches.reduce((total, batch) => total + batch.students.length, 0),
      coursesPerCategory,
      recentEnrollments,
      recentUsers,
      upcomingBatches,
    };
    
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Resources API
app.get('/api/resources', async (req, res) => {
  try {
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    
    const resources = await prisma.resource.findMany({
      where: courseId ? { courseId } : undefined,
      include: { course: true }
    });
    
    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    const resourceData = req.body;
    const newResource = await prisma.resource.create({
      data: resourceData
    });
    
    res.status(201).json({ success: true, data: newResource });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Schedule API
app.get('/api/schedules', async (req, res) => {
  try {
    const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
    
    const schedules = await prisma.schedule.findMany({
      where: batchId ? { batchId } : undefined,
      include: { batch: { include: { course: true, instructor: true } } }
    });
    
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.post('/api/schedules', async (req, res) => {
  try {
    const scheduleData = req.body;
    const newSchedule = await prisma.schedule.create({
      data: scheduleData,
      include: { batch: true }
    });
    
    res.status(201).json({ success: true, data: newSchedule });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Student-Batch Management
app.post('/api/student-batches', async (req, res) => {
  try {
    const { studentId, batchId } = req.body;
    
    // Check if already enrolled
    const exists = await prisma.studentBatch.findFirst({
      where: { studentId, batchId }
    });
    
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Student is already enrolled in this batch'
      });
    }
    
    const enrollment = await prisma.studentBatch.create({
      data: { studentId, batchId }
    });
    
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.delete('/api/student-batches/:studentId/:batchId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const batchId = parseInt(req.params.batchId);
    
    await prisma.studentBatch.deleteMany({
      where: { studentId, batchId }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Student-Course Management
app.post('/api/student-courses', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    
    // Check if already enrolled
    const exists = await prisma.studentCourse.findFirst({
      where: { studentId, courseId }
    });
    
    if (exists) {
      return res.status(400).json({
        success: false,
        error: 'Student is already enrolled in this course'
      });
    }
    
    const enrollment = await prisma.studentCourse.create({
      data: { studentId, courseId }
    });
    
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.delete('/api/student-courses/:studentId/:courseId', async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const courseId = parseInt(req.params.courseId);
    
    await prisma.studentCourse.deleteMany({
      where: { studentId, courseId }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// User Password Change
app.post('/api/users/:userId/change-password', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { newPassword } = req.body;
    
    const user = await prisma.user.update({
      where: { userId },
      data: { 
        password: newPassword,
        mustResetPassword: false
      }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
