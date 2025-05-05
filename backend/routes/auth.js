
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { handleApiError } from '../utils/errorHandler.js';

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
    
    const user = await prisma.User.findUnique({
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
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    //Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    //Return success response with token and user data
    res.json({
      success: true,
      data: {
        token,
        user: {
          userId: user.userId,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          address: user.address,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          mustResetPassword: user.mustResetPassword,
          profilePicture: user.profilePicture
        }
      }
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

//Change password
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'User ID, current password, and new password are required'
      });
    }
    
    //Find instructor/student by ID
    const user = await prisma.User.findUnique({
      where: { userId: parseInt(userId) }
    });
    
    //Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    //Check if current password matches 
    if (user.password !== currentPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }
    
    //Update with new password
    await prisma.User.update({
      where: { userId: parseInt(userId) },
      data: {
        password: newPassword,
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
