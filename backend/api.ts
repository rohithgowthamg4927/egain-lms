
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

app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    const newUser = await prisma.user.create({
      data: userData,
      include: { profilePicture: true }
    });
    
    res.status(201).json({ success: true, data: newUser });
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
        instructor: true
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
    
    // Mock data for student enrollments (would come from real DB in production)
    const recentEnrollments = [
      { studentName: 'John Doe', courseName: 'Introduction to React', date: new Date('2023-05-25') },
      { studentName: 'Robert Brown', courseName: 'Flutter for Beginners', date: new Date('2023-05-20') },
      { studentName: 'John Doe', courseName: 'Python for Data Science', date: new Date('2023-05-15') },
      { studentName: 'Robert Brown', courseName: 'Docker Essentials', date: new Date('2023-05-10') },
    ];
    
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
      activeStudents: Math.floor(students.length * 0.8), // Mock data: 80% of students are active
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

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
