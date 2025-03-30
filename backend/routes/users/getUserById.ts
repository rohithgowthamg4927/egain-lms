
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get user by ID with their courses
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        profilePicture: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Get courses based on user role
    let courses = [];
    
    if (user.role === 'student') {
      // Get courses the student is enrolled in
      const studentCourses = await prisma.studentCourse.findMany({
        where: { studentId: userId },
        include: { course: true }
      });
      
      courses = studentCourses.map(sc => sc.course);
    } else if (user.role === 'instructor') {
      // Get courses the instructor teaches
      const batches = await prisma.batch.findMany({
        where: { instructorId: userId },
        include: { course: true }
      });
      
      // Extract unique courses
      const courseMap = new Map();
      batches.forEach(batch => {
        if (batch.course && !courseMap.has(batch.course.courseId)) {
          courseMap.set(batch.course.courseId, batch.course);
        }
      });
      
      courses = Array.from(courseMap.values());
    }
    
    res.json({ 
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

export default router;
