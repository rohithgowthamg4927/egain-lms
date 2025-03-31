
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Login API
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    console.log(`Login attempt: ${email} with role: ${role}`);
    
    // Check if there's a database connection issue
    try {
      await prisma.$connect();
    } catch (dbError) {
      console.error('Database connection error during login:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database connection error'
      });
    }
    
    // Debugging: Log all users to check if user exists
    const allUsers = await prisma.user.findMany();
    console.log(`Found ${allUsers.length} users in database`);
    
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        role: role
      },
      include: { profilePicture: true }
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log(`User not found for email: ${email} with role: ${role}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
    console.log(`Comparing passwords: '${password}' vs '${user.password}'`);
    
    // Simple password check - remove string trimming and ensure exact match
    if (password === user.password) {
      // Successful login
      console.log(`User logged in successfully: ${user.email} with role: ${user.role}`);
      
      // Return the user data and a token
      res.status(200).json({
        success: true,
        data: {
          user,
          token: 'mock-jwt-token' // In a real app, you'd generate a JWT here
        }
      });
    } else {
      console.log(`Password mismatch for user: ${email}`);
      console.log(`Received password: '${password}', stored password: '${user.password}'`);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    handleApiError(res, error);
  }
});

// Database setup endpoint
router.post('/setup-database', async (req, res) => {
  try {
    // Check if the admin user exists
    const adminExists = await prisma.user.findFirst({ where: { role: 'admin' } });
    
    if (!adminExists) {
      // Create the admin user if it doesn't exist
      console.log("Creating admin user");
      await prisma.user.create({ 
        data: { 
          fullName: 'Admin User',
          email: 'admin@lms.com',
          role: 'admin',
          password: 'Admin@123',
          mustResetPassword: false
        } 
      });
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }
    
    res.status(200).json({ success: true, message: 'Database setup completed' });
  } catch (error) {
    console.error("Database setup error:", error);
    handleApiError(res, error);
  }
});

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Run setup on import
(async () => {
  try {
    console.log("Checking for admin user...");
    const adminExists = await prisma.user.findFirst({ where: { role: 'admin' } });
    
    if (!adminExists) {
      console.log("Creating default admin user...");
      await prisma.user.create({ 
        data: { 
          fullName: 'Admin User',
          email: 'admin@lms.com',
          role: 'admin',
          password: 'Admin@123',
          mustResetPassword: false
        } 
      });
      console.log("Default admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error during initial setup:", error);
  }
})();

export default router;
