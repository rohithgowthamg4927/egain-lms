import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { handleApiError } from '../utils/errorHandler.js';
import { hashPassword, comparePassword } from '../utils/password.js';

const router = express.Router();
const prisma = new PrismaClient();

//endpoint for login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    //check creds
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profilePicture: true
      }
    });
    
    //match user with role
    if (!user || (role && user.role !== role)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    //match password from db
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    //Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    //Return success response with token and user data
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

//Change password
router.post('/change-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'User ID and new password are required'
      });
    }
    
    //Find user by ID
    const user = await prisma.user.findUnique({
      where: { userId: parseInt(userId) }
    });
    
    //Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    //Hash and update new password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { userId: parseInt(userId) },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
        mustResetPassword: false
      }
    });
    
    //Return a response
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

//Health check route to display timestamp and OK
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;
