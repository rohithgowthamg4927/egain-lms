import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { handleApiError } from '../utils/errorHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const prisma = new PrismaClient();

// Helper function for logging
const log = (message, data = {}) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ${message}`, data);
};

//endpoint for login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    log('Login request received', { email, role, password: '***' });
    
    //check creds
    if (!email || !password) {
      log('Missing credentials', { email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        debug: { email: !!email, password: !!password }
      });
    }
    
    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      log('JWT_SECRET not set');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }
    
    const user = await prisma.User.findUnique({
      where: { email },
      include: {
        profilePicture: true
      }
    });
    
    log('Found user', { 
      exists: !!user, 
      email: user?.email, 
      role: user?.role,
      password: user?.password 
    });
    
    // Return detailed error information
    if (!user) {
      log('User not found');
      return res.status(401).json({
        success: false,
        error: 'User not found',
        debug: { email }
      });
    }
    
    if (role && user.role !== role) {
      log('Role mismatch', { 
        requestedRole: role, 
        userRole: user.role 
      });
      return res.status(401).json({
        success: false,
        error: 'Role mismatch',
        debug: { 
          requestedRole: role, 
          userRole: user.role 
        }
      });
    }
    
    if (user.password !== password) {
      log('Password mismatch', { 
        providedPassword: password, 
        storedPassword: user.password 
      });
      return res.status(401).json({
        success: false,
        error: 'Password mismatch',
        debug: { 
          providedPassword: password, 
          storedPassword: user.password 
        }
      });
    }
    
    //Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    log('Login successful', { 
      userId: user.userId, 
      email: user.email, 
      role: user.role 
    });
    
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
    log('Login error', { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      error: 'Server error',
      debug: {
        message: error.message,
        stack: error.stack
      }
    });
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

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;
