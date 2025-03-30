
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler';
import bcrypt from 'bcrypt';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users or filtered by role
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    
    const users = await prisma.user.findMany({
      where: role ? { role: role.toString() } : {},
      include: {
        profilePicture: true
      }
    });
    
    res.json({ success: true, data: users });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get user by ID with their courses
router.get('/:id', async (req, res) => {
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

// Create new user
router.post('/', async (req, res) => {
  try {
    const { fullName, email, role, password, phoneNumber, address, mustResetPassword } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists'
      });
    }
    
    // Create the user with address field
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        role,
        password,
        phoneNumber,
        address,
        mustResetPassword: mustResetPassword !== undefined ? mustResetPassword : true
      },
      include: {
        profilePicture: true
      }
    });
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { fullName, email, role, password, phoneNumber, address, mustResetPassword } = req.body;
    
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
    
    // Check if email is being changed and already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          userId: { not: userId }
        }
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'A user with this email already exists'
        });
      }
    }
    
    // Update the user including address field
    const user = await prisma.user.update({
      where: { userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(password !== undefined && { password }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(mustResetPassword !== undefined && { mustResetPassword })
      }
    });
    
    res.json({ success: true, data: user });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
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
      // Reassign or delete batches taught by this instructor
      // For now, we'll just set the instructor to null if possible
      // This might need to be handled differently based on business logic
      const batches = await prisma.batch.findMany({
        where: { instructorId: userId }
      });

      if (batches.length > 0) {
        await prisma.batch.updateMany({
          where: { instructorId: userId },
          data: { instructorId: null }
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
