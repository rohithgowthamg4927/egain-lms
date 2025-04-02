
import express from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard metrics
router.get('/', async (req, res) => {
  try {
    console.log("Fetching dashboard metrics");
    
    // Get counts for various entities - Using enum values from Prisma
    const studentsCount = await prisma.user.count({
      where: { role: Role.student }
    });
    
    const instructorsCount = await prisma.user.count({
      where: { role: Role.instructor }
    });
    
    const coursesCount = await prisma.course.count();
    
    // Get recent batches
    const recentBatches = await prisma.batch.findMany({
      take: 5,
      orderBy: { startDate: 'desc' },
      include: {
        course: true,
        instructor: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          }
        },
        studentBatches: true // Use the correct relation name
      }
    });
    
    // Transform the batches to include student count
    const formattedBatches = recentBatches.map(batch => ({
      batchId: batch.batchId,
      batchName: batch.batchName,
      startDate: batch.startDate,
      endDate: batch.endDate,
      course: batch.course,
      instructor: batch.instructor,
      studentsCount: batch.studentBatches?.length ?? 0
    }));
    
    // Get categories with course counts
    const categories = await prisma.courseCategory.findMany({
      include: {
        courses: {
          include: {
            studentCourses: true // Use the correct relation name
          }
        }
      }
    });
    
    // Process categories for chart data
    const coursesByCategory = categories.map(category => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      coursesCount: category.courses?.length ?? 0,
      courses: category.courses.map(course => ({
        courseId: course.courseId,
        courseName: course.courseName,
        studentsCount: course.studentCourses?.length ?? 0
      }))
    }));
    
    // Get popular courses (by enrollment count)
    const popularCourses = await prisma.course.findMany({
      take: 5,
      include: {
        category: true,
        studentCourses: true // Use the correct relation name
      },
      orderBy: {
        studentCourses: {
          _count: 'desc'
        }
      }
    });
    
    // Transform courses for the response
    const formattedPopularCourses = popularCourses.map(course => ({
      course: {
        courseId: course.courseId,
        courseName: course.courseName,
        description: course.description,
        category: course.category
      },
      _count: {
        students: course.studentCourses?.length ?? 0
      }
    }));
    
    // Calculate upcoming schedule items
    const now = new Date();
    const upcomingSchedules = await prisma.schedule.findMany({
      take: 5,
      where: {
        startTime: {
          gte: now // Using direct Date object
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      include: {
        batch: {
          include: {
            course: true,
            instructor: {
              select: {
                userId: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    // Format upcoming schedules
    const formattedSchedules = upcomingSchedules.map(schedule => ({
      scheduleId: schedule.scheduleId,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      topic: schedule.topic || 'Class Session', // Default topic if none provided
      platform: schedule.platform || 'Online',  // Default platform if none provided
      meetingLink: schedule.meetingLink,
      batch: schedule.batch
    }));
    
    // Get category distribution (students per category)
    const categoryDistribution = categories.map(category => {
      // Sum up students across all courses in this category
      const totalStudents = category.courses.reduce((sum, course) => {
        return sum + (course.studentCourses?.length ?? 0);
      }, 0);
      
      return {
        name: category.categoryName,
        value: totalStudents
      };
    });
    
    // Prepare and return metrics
    const metrics = {
      counts: {
        students: studentsCount,
        instructors: instructorsCount,
        courses: coursesCount
      },
      coursesByCategory,
      recentBatches: formattedBatches,
      popularCourses: formattedPopularCourses,
      upcomingSchedules: formattedSchedules,
      categoryDistribution
    };
    
    console.log("Dashboard metrics prepared successfully");
    // Log the final metrics for debugging
    console.log("Final metrics being sent:", JSON.stringify(metrics, null, 2));
    
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    handleApiError(res, error);
  }
});

export default router;
