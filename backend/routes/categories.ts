
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.courseCategory.findMany();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a category
router.post('/', async (req: Request, res: Response) => {
  try {
    const categoryData = req.body;
    const newCategory = await prisma.courseCategory.create({
      data: categoryData
    });
    
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
