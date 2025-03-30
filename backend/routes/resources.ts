
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get all resources
router.get('/', async (req: Request, res: Response) => {
  try {
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    
    const resources = await prisma.resource.findMany({
      where: courseId ? { courseId } : undefined,
      include: { course: true }
    });
    
    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a resource
router.post('/', async (req: Request, res: Response) => {
  try {
    const resourceData = req.body;
    const newResource = await prisma.resource.create({
      data: resourceData
    });
    
    res.status(201).json({ success: true, data: newResource });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
