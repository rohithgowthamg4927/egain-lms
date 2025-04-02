import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    
    const whereClause = role ? { role } : {};
    
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profilePicture: true
      }
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get user by ID
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
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      password,
      role,
      phoneNumber,
      address,
      mustResetPassword 
    } = req.body;
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user - removed 'active' field since it doesn't exist in schema
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
        phoneNumber,
        address,
        mustResetPassword: Boolean(mustResetPassword),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Filter out password from response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(201).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { 
      fullName, 
      email, 
      password,
      role,
      phoneNumber,
      address,
      mustResetPassword,
      active
    } = req.body;
    
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
    
    // If email is being changed, check if new email is already in use
    if (email && email !== existingUser.email) {
      const userWithSameEmail = await prisma.user.findUnique({
        where: { email }
      });
      
      if (userWithSameEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use'
        });
      }
    }
    
    // Prepare update data
    const updateData = {
      ...(fullName !== undefined && { fullName }),
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
      ...(phoneNumber !== undefined && { phoneNumber }),
      ...(address !== undefined && { address }),
      ...(mustResetPassword !== undefined && { mustResetPassword }),
      ...(active !== undefined && { active }),
      updatedAt: new Date()
    };
    
    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData
    });
    
    // Filter out password from response
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { userId }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if user is an instructor with assigned batches
    if (user.role === 'instructor') {
      const associatedBatches = await prisma.batch.findMany({
        where: { instructorId: userId }
      });
      
      if (associatedBatches.length > 0) {
        // Update the instructorId to null for all batches this instructor is assigned to
        await prisma.batch.updateMany({
          where: { instructorId: userId },
          data: { instructorId: null }
        });
      }
    }
    
    // Remove student enrollments if user is a student
    if (user.role === 'student') {
      await prisma.studentBatch.deleteMany({
        where: { studentId: userId }
      });
      
      await prisma.studentCourse.deleteMany({
        where: { studentId: userId }
      });
    }
    
    // Delete profile picture if exists
    if (user.profilePictureId) {
      await prisma.file.delete({
        where: { fileId: user.profilePictureId }
      });
    }
    
    // Delete user
    await prisma.user.delete({
      where: { userId }
    });
    
    res.json({
      success: true
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
