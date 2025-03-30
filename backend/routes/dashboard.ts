
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Dashboard Metrics API
router.get('/', async (req: Request, res: Response) => {
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

export default router;
