
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all users or filtered by role
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role } = req.query;
    
    const users = await prisma.user.findMany({
      where: role ? { 
        role: role.toString() as 'admin' | 'instructor' | 'student'
      } : {},
      include: {
        profilePicture: true
      }
    });
    
    res.json({ success: true, data: users });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
