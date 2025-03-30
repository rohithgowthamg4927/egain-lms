import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users with optional role filter
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    
    const users = await prisma.user.findMany({
      where: role ? { role: role as string } : undefined,
      include: { profilePicture: true },
    });
    
    return res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

// Get a specific user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    console.log(`Processing GET request for user with ID: ${userId}`);
    
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { profilePicture: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User with ID ${userId} not found`
      });
    }
    
    console.log(`Found user:`, user);
    
    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return handleApiError(res, error);
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { fullName, email, role, password, phoneNumber, address, mustResetPassword } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !role || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fullName, email, role, and password are required',
      });
    }
    
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        role,
        password, // In a real app, this should be hashed
        phoneNumber,
        address,
        mustResetPassword: mustResetPassword ?? true,
      },
    });
    
    return res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

// Update a user
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { fullName, email, role, password, phoneNumber, address, mustResetPassword } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }
    
    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(password !== undefined && { password }), // Should be hashed in a real app
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(mustResetPassword !== undefined && { mustResetPassword }),
      },
    });
    
    return res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

// Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }
    
    await prisma.user.delete({
      where: { userId },
    });
    
    return res.json({
      success: true,
      message: `User with ID ${userId} has been deleted`,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
