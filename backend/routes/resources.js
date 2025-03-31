
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all resources
router.get('/', async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({
      include: {
        course: true
      }
    });
    
    res.json({ success: true, data: resources });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get resources by course ID
router.get('/course/:courseId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    
    const resources = await prisma.resource.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, data: resources });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get resource by ID
router.get('/:id', async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    
    const resource = await prisma.resource.findUnique({
      where: { resourceId },
      include: {
        course: true
      }
    });
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }
    
    res.json({ success: true, data: resource });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a new resource
router.post('/', async (req, res) => {
  try {
    const { 
      title,
      description,
      type,
      url,
      courseId
    } = req.body;
    
    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        type,
        url,
        courseId: parseInt(courseId),
        createdAt: new Date()
      }
    });
    
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update a resource
router.put('/:id', async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const { 
      title,
      description,
      type,
      url,
      courseId
    } = req.body;
    
    const resource = await prisma.resource.update({
      where: { resourceId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(url !== undefined && { url }),
        ...(courseId !== undefined && { courseId: parseInt(courseId) })
      }
    });
    
    res.json({ success: true, data: resource });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete a resource
router.delete('/:id', async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    
    await prisma.resource.delete({
      where: { resourceId }
    });
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
