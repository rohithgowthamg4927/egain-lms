
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Create new user
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fullName, email, role, password, phoneNumber, address, mustResetPassword } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists'
      });
    }
    
    // Create the user with address field
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        role: role as 'admin' | 'instructor' | 'student',
        password,
        phoneNumber,
        address,
        mustResetPassword: mustResetPassword !== undefined ? mustResetPassword : true
      },
      include: {
        profilePicture: true
      }
    });
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
