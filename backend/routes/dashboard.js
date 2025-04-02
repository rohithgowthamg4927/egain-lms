
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard metrics
router.get('/', async (req, res) => {
  try {
    // Get counts for various entities with null checks
    const studentsCount = await prisma.user.count({
      where: { role: 'student' }
    });
    
    const instructorsCount = await prisma.user.count({
      where: { role: 'instructor' }
    });
    
    const coursesCount = await prisma.course.count();
    
    const batchesCount = await prisma.batch.count();
    
    const categoriesCount = await prisma.category.count();
    
    const resourcesCount = await prisma.resource.count();
    
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
            photoUrl: true
          }
        },
        students: {
          include: {
            student: {
              select: {
                userId: true,
                fullName: true
              }
            }
          }
        }
      }
    });
    
    // Transform the batches to include student count
    const formattedBatches = recentBatches.map(batch => ({
      ...batch,
      studentsCount: batch.students ? batch.students.length : 0
    }));
    
    // Get popular courses (by enrollment count)
    const coursesWithStudents = await prisma.course.findMany({
      take: 5,
      include: {
        category: true,
        students: {
          select: {
            studentId: true
          }
        }
      },
      orderBy: {
        students: {
          _count: 'desc'
        }
      }
    });
    
    // Transform courses to include student count
    const popularCourses = coursesWithStudents.map(course => ({
      course: {
        courseId: course.courseId,
        courseName: course.courseName,
        description: course.description,
        category: course.category
      },
      _count: {
        students: course.students ? course.students.length : 0
      }
    }));
    
    // Calculate upcoming schedule items
    const now = new Date();
    const upcomingSchedules = await prisma.schedule.findMany({
      take: 5,
      where: {
        startTime: {
          gte: now.toISOString().split('T')[0] // Today or future dates
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
    
    // Get course distribution by category
    const categories = await prisma.category.findMany({
      include: {
        courses: {
          include: {
            students: true
          }
        }
      }
    });
    
    const categoryDistribution = categories.map(category => {
      // Count total students across all courses in this category
      const totalStudents = category.courses.reduce((sum, course) => {
        return sum + (course.students ? course.students.length : 0);
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
        courses: coursesCount,
        batches: batchesCount,
        categories: categoriesCount,
        resources: resourcesCount
      },
      recentBatches: formattedBatches,
      popularCourses,
      upcomingSchedules,
      categoryDistribution
    };
    
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    handleApiError(res, error);
  }
});

export default router;
