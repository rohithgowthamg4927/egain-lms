
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { handleApiError } from '../utils/errorHandler.js';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate random password
const generateRandomPassword = (length = 8) => {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%^&*";
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = "";
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

// Get all users
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    
    const whereClause = role ? { role } : {};
    
    const users = await prisma.User.findMany({
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
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    const user = await prisma.User.findUnique({
      where: { userId: userId },  // Make sure userId is explicitly provided
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
    const existingUser = await prisma.User.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use'
      });
    }
    
    // Create user without hashing password as requested
    const user = await prisma.User.create({
      data: {
        fullName,
        email,
        password,
        role,
        phoneNumber,
        address,
        mustResetPassword: Boolean(mustResetPassword),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    res.status(201).json({
      success: true,
      data: user
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
      mustResetPassword
    } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.User.findUnique({
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
      const userWithSameEmail = await prisma.User.findUnique({
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
      ...(password !== undefined && { password }),
      ...(mustResetPassword !== undefined && { mustResetPassword }),
      updatedAt: new Date()
    };
    
    // Update user
    const updatedUser = await prisma.User.update({
      where: { userId },
      data: updateData
    });
    
    res.json({
      success: true,
      data: updatedUser
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
    const user = await prisma.User.findUnique({
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
      const associatedBatches = await prisma.Batch.findMany({
        where: { instructorId: userId }
      });
      
      if (associatedBatches.length > 0) {
        // Update the instructorId to null for all batches this instructor is assigned to
        await prisma.Batch.updateMany({
          where: { instructorId: userId },
          data: { instructorId: null }
        });
      }
    }
    
    // Remove student enrollments if user is a student
    if (user.role === 'student') {
      await prisma.StudentBatch.deleteMany({
        where: { studentId: userId }
      });
      
      await prisma.StudentCourse.deleteMany({
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
    await prisma.User.delete({
      where: { userId }
    });
    
    res.json({
      success: true
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Regenerate password for a user
router.post('/:id/regenerate-password', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const user = await prisma.User.findUnique({
      where: { userId }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Generate new password
    const newPassword = generateRandomPassword(10);
    
    // Update user with new password
    await prisma.User.update({
      where: { userId },
      data: { 
        password: newPassword,
        mustResetPassword: true,
        updatedAt: new Date()
      }
    });
    
    res.json({
      success: true,
      data: { password: newPassword }
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
