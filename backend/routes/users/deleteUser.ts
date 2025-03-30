
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Delete user
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { userId }
    });
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Delete related records first based on role
    if (existingUser.role === 'student') {
      // Delete student's batch enrollments
      await prisma.studentBatch.deleteMany({
        where: { studentId: userId }
      });
      
      // Delete student's course enrollments
      await prisma.studentCourse.deleteMany({
        where: { studentId: userId }
      });
      
      // Delete student's reviews
      await prisma.courseReview.deleteMany({
        where: { userId }
      });
    } else if (existingUser.role === 'instructor') {
      // Check if instructor is teaching any batches
      const batches = await prisma.batch.findMany({
        where: { instructorId: userId }
      });

      if (batches.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete instructor who is teaching active batches'
        });
      }
    }
    
    // Delete profile picture if exists
    await prisma.profilePicture.deleteMany({
      where: { userId }
    });
    
    // Finally delete the user
    await prisma.user.delete({
      where: { userId }
    });
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
