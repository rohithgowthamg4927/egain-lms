
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Update user
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { fullName, email, role, password, phoneNumber, address, mustResetPassword } = req.body;
    
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
    
    // Check if email is being changed and already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email,
          userId: { not: userId }
        }
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'A user with this email already exists'
        });
      }
    }
    
    // Update the user including address field
    const user = await prisma.user.update({
      where: { userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role: role as 'admin' | 'instructor' | 'student' }),
        ...(password !== undefined && { password }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(address !== undefined && { address }),
        ...(mustResetPassword !== undefined && { mustResetPassword })
      }
    });
    
    res.json({ success: true, data: user });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
