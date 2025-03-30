
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get all schedules
router.get('/', async (req: Request, res: Response) => {
  try {
    const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
    
    const schedules = await prisma.schedule.findMany({
      where: batchId ? { batchId } : undefined,
      include: { batch: { include: { course: true, instructor: true } } }
    });
    
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a schedule
router.post('/', async (req: Request, res: Response) => {
  try {
    const scheduleData = req.body;
    const newSchedule = await prisma.schedule.create({
      data: scheduleData,
      include: { batch: true }
    });
    
    res.status(201).json({ success: true, data: newSchedule });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
