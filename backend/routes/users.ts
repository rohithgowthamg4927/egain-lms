
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', async (req, res) => {
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

// Current user API
router.get('/current', async (req, res) => {
  try {
    // In a real app, you'd get this from the JWT token
    // Here we're just returning the first admin for demonstration
    const user = await prisma.user.findFirst({
      where: { role: 'admin' },
      include: { profilePicture: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'No user found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Individual User API
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { profilePicture: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Get courses for this user based on role
    let courses = [];
    if (user.role === 'student') {
      const studentCourses = await prisma.studentCourse.findMany({
        where: { studentId: userId },
        include: {
          course: {
            include: { category: true }
          }
        }
      });
      courses = studentCourses.map(sc => sc.course);
    } else if (user.role === 'instructor') {
      // For instructors, get courses from batches they teach
      const batches = await prisma.batch.findMany({
        where: { instructorId: userId },
        include: {
          course: {
            include: { category: true }
          }
        }
      });
      // Extract unique courses (an instructor might have multiple batches for the same course)
      const courseMap = new Map();
      batches.forEach(batch => {
        if (!courseMap.has(batch.course.courseId)) {
          courseMap.set(batch.course.courseId, batch.course);
        }
      });
      courses = Array.from(courseMap.values());
    }
    
    res.status(200).json({ 
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

// Create User API
router.post('/', async (req, res) => {
  try {
    const userData = req.body;
    
    // Check if email is already in use
    const existingUser = await prisma.user.findFirst({ 
      where: { email: userData.email } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already in use' 
      });
    }
    
    // Create the new user with the provided data
    const newUser = await prisma.user.create({
      data: userData
    });
    
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update User API
router.put('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userData = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: userData,
      include: { profilePicture: true }
    });
    
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete User API
router.delete('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    await prisma.user.delete({
      where: { userId }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// User Password Change
router.post('/:userId/change-password', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { newPassword } = req.body;
    
    const user = await prisma.user.update({
      where: { userId },
      data: { 
        password: newPassword,
        mustResetPassword: false
      }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
