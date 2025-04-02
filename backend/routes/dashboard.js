
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard metrics
router.get('/', async (req, res) => {
  try {
    console.log("Fetching dashboard metrics");
    
    // Get counts for various entities - Using direct count queries
    const studentsCount = await prisma.user.count({
      where: { role: 'student' }
    });
    
    const instructorsCount = await prisma.user.count({
      where: { role: 'instructor' }
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
            // Removed photoUrl as it doesn't exist in the User model
          }
        },
        _count: {
          select: { students: true }
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
      studentsCount: batch._count.students
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
              select: { students: true }
            }
          }
        }
      }
    });
    
    // Process categories for chart data
    const coursesByCategory = categories.map(category => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      coursesCount: category._count.courses,
      courses: category.courses.map(course => ({
        courseId: course.courseId,
        courseName: course.courseName,
        studentsCount: course._count.students
      }))
    }));
    
    // Get popular courses (by enrollment count)
    const coursesWithEnrollments = await prisma.course.findMany({
      take: 5,
      include: {
        category: true,
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        students: {
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
        students: course._count.students
      }
    }));
    
    // Calculate upcoming schedule items
    const now = new Date();
    const upcomingSchedules = await prisma.schedule.findMany({
      take: 5,
      where: {
        startTime: {
          gte: now
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
          totalStudents += course._count.students;
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
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    handleApiError(res, error);
  }
});

export default router;
