
import express from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard metrics
router.get('/', async (req, res) => {
  try {
    console.log("Fetching dashboard metrics");
    
    const studentsCount = await prisma.User.count({
      where: { role: Role.student }
    });
    
    const instructorsCount = await prisma.User.count({
      where: { role: Role.instructor }
    });
    
    const coursesCount = await prisma.Course.count();
    
    const recentBatches = await prisma.Batch.findMany({
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
        students: true
      }
    });
    
    const formattedBatches = recentBatches.map(batch => ({
      batchId: batch.batchId,
      batchName: batch.batchName,
      startDate: batch.startDate,
      endDate: batch.endDate,
      course: batch.course,
      instructor: batch.instructor,
      studentsCount: batch.students?.length || 0
    }));
    
    const categories = await prisma.CourseCategory.findMany({
      include: {
        courses: {
          include: {
            studentCourses: true
          }
        }
      }
    });
    
    const coursesByCategory = categories.map(category => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      coursesCount: category.courses?.length || 0,
      courses: category.courses.map(course => ({
        courseId: course.courseId,
        courseName: course.courseName,
        studentsCount: course.studentCourses?.length || 0
      }))
    }));
    
    //Top 5 courses by student count
  const popularCourses = await prisma.Batch.findMany({
    take: 5,
    where: {
      course: {
        isNot: null,
      },
    },
    include: {
      course: {
        include: {
          category: true,
        },
      },
      students: true, 
    },
    orderBy: {
      students: {
        _count: 'desc',
      },
    },
  });
    
    const formattedPopularCourses = popularCourses.map(batch => ({
      course: {
        courseId: batch.course.courseId,
        courseName: batch.course.courseName,
        description: batch.course.description,
        category: batch.course.category
      },
      _count: {
        students: batch.students.length || 0
      }
    }));
    
    const now = new Date();
    const upcomingSchedules = await prisma.Schedule.findMany({
      take: 5,
      where: {
        startTime: {
          gte: now,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
      include: {
        batch: {
          include: {
            course: true,
            instructor: {
              select: {
                userId: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      }
    });
    
    const formattedSchedules = upcomingSchedules.map(schedule => ({
      scheduleId: schedule.scheduleId,
      scheduleDate: schedule.scheduleDate,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      topic: schedule.topic || 'Class Session',
      platform: schedule.platform || 'Online',
      meetingLink: schedule.meetingLink,
      batch: schedule.batch
    }));
    
    const categoryDistribution = categories.map(category => {
      const totalStudents = category.courses.reduce((sum, course) => {
        return sum + (course.studentCourses?.length || 0);
      }, 0);
      
      return {
        name: category.categoryName,
        value: totalStudents
      };
    });
    
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
    
    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    handleApiError(res, error);
  }
});

router.get('/counts', async (req, res) => {
  try {
    const coursesCount = await prisma.Course.count();
    const studentsCount = await prisma.User.count({
      where: { role: Role.student }
    });
    
    res.json({
      success: true,
      data: {
        coursesCount,
        studentsCount
      }
    });
  } catch (error) {
    console.error('Error fetching counts:', error);
    handleApiError(res, error);
  }
});

export default router;
