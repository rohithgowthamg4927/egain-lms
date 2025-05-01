import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';
import { hashPassword } from '../utils/password.js';

const router = express.Router();
const prisma = new PrismaClient();

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
      where: { userId: userId },  //userId should be explicitly provided
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

// Create user
router.post('/', async (req, res) => {
    try {
        const { fullName, email, phoneNumber, role, password, mustResetPassword } = req.body;

        // Generate random password if not provided
        const userPassword = password || generateRandomPassword(10);
        
        // Hash the password
        const hashedPassword = await hashPassword(userPassword);

        // Create user with hashed password
        const user = await prisma.User.create({
            data: {
                fullName,
                email,
                phoneNumber,
                role,
                password: hashedPassword,
                mustResetPassword: role === 'admin' ? false : (mustResetPassword !== undefined ? mustResetPassword : true)
            }
        });

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { fullName, email, phoneNumber, role, password, mustResetPassword, address } = req.body;
        const userId = parseInt(req.params.id);

        // Prepare update data
        const updateData = {
            fullName,
            email,
            phoneNumber,
            role,
            address
        };

        // Only update password if provided
        if (password) {
            updateData.password = await hashPassword(password);
            updateData.mustResetPassword = true;
        }

        // Only update mustResetPassword for non-admin roles
        if (role !== 'admin' && mustResetPassword !== undefined) {
            updateData.mustResetPassword = mustResetPassword;
        }

        const user = await prisma.User.update({
            where: { userId },
            data: updateData
        });

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
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
        // Update instructorId to null for all batches this instructor is assigned to
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

// Regenerate password
router.post('/:id/regenerate-password', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Find user
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
        const hashedPassword = await hashPassword(newPassword);

        // Update user with new hashed password
        await prisma.User.update({
            where: { userId },
            data: {
                password: hashedPassword,
                mustResetPassword: user.role === 'admin' ? false : true
            }
        });

        res.json({
            success: true,
            data: { password: newPassword }
        });
    } catch (error) {
        console.error('Regenerate password error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
