
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Login API
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    const user = await prisma.user.findFirst({
      where: {
        email,
        role: role as any
      },
      include: { profilePicture: true }
    });
    
    if (user && password === user.password) {
      res.status(200).json({
        success: true,
        data: {
          user,
          token: 'mock-jwt-token' // In a real app, you'd generate a JWT here
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    handleApiError(res, error);
  }
});

// Database setup endpoint
router.post('/setup-database', async (req, res) => {
  try {
    // Example database setup logic
    const adminExists = await prisma.user.findFirst({ where: { role: 'admin' } });
    
    if (!adminExists) {
      await prisma.user.create({ 
        data: { 
          fullName: 'Admin User',
          email: 'admin@lms.com',
          role: 'admin',
          password: 'Admin@123',
          mustResetPassword: false
        } 
      });
    }
    
    res.status(200).json({ success: true, message: 'Database setup completed' });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
