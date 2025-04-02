
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
        _count: {
          select: { studentBatches: true }
        }
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
      studentsCount: batch._count?.studentBatches ?? 0
    }));
    
    // Get categories with course counts
    const categories = await prisma.courseCategory.findMany({
      include: {
        _count: {
          select: { courses: true }
        },
        courses: {
          include: {
            _count: {
              select: { studentCourses: true }
            }
          }
        }
      }
    });
    
    // Process categories for chart data
    const coursesByCategory = categories.map(category => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      coursesCount: category._count?.courses ?? 0,
      courses: category.courses.map(course => ({
        courseId: course.courseId,
        courseName: course.courseName,
        studentsCount: course._count?.studentCourses ?? 0
      }))
    }));
    
    // Get popular courses (by enrollment count)
    const coursesWithEnrollments = await prisma.course.findMany({
      take: 5,
      include: {
        category: true,
        _count: {
          select: {
            studentCourses: true
          }
        }
      },
      orderBy: {
        studentCourses: {
          _count: 'desc'
        }
      }
    });
    
    // Transform courses for the response
    const popularCourses = coursesWithEnrollments.map(course => ({
      course: {
        courseId: course.courseId,
        courseName: course.courseName,
        description: course.description,
        category: course.category
      },
      _count: {
        students: course._count?.studentCourses ?? 0
      }
    }));
    
    // Calculate upcoming schedule items
    const now = new Date();
    const upcomingSchedules = await prisma.schedule.findMany({
      take: 5,
      where: {
        startTime: {
          gte: now  // Using direct Date object instead of ISO string
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
    const categoryDistribution = await Promise.all(
      categories.map(async (category) => {
        // Sum up students across all courses in this category
        let totalStudents = 0;
        
        for (const course of category.courses) {
          totalStudents += course._count?.studentCourses ?? 0;
        }
        
        return {
          name: category.categoryName,
          value: totalStudents
        };
      })
    );
    
    // Prepare and return metrics
    const metrics = {
      counts: {
        students: studentsCount,
        instructors: instructorsCount,
        courses: coursesCount
      },
      coursesByCategory,
      recentBatches: formattedBatches,
      popularCourses,
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
