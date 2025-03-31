
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        category: true,
        reviews: {
          include: {
            user: true
          }
        }
      }
    });
    
    res.json({ success: true, data: courses });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    
    const course = await prisma.course.findUnique({
      where: { courseId },
      include: {
        category: true,
        reviews: {
          include: {
            user: true
          }
        },
        batches: {
          include: {
            instructor: true,
            schedule: true
          }
        },
        resources: true
      }
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    res.json({ success: true, data: course });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a new course
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      price,
      duration,
      level,
      categoryId
    } = req.body;
    
    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        level,
        categoryId: parseInt(categoryId),
        createdAt: new Date()
      }
    });
    
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update a course
router.put('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { 
      title, 
      description, 
      price,
      duration,
      level,
      categoryId
    } = req.body;
    
    const course = await prisma.course.update({
      where: { courseId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(level !== undefined && { level }),
        ...(categoryId !== undefined && { categoryId: parseInt(categoryId) })
      }
    });
    
    res.json({ success: true, data: course });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete a course
router.delete('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    
    // Check if there are batches for this course
    const batchesCount = await prisma.batch.count({
      where: { courseId }
    });
    
    if (batchesCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete course with active batches'
      });
    }
    
    // Delete student enrollments
    await prisma.studentCourse.deleteMany({
      where: { courseId }
    });
    
    // Delete course reviews
    await prisma.courseReview.deleteMany({
      where: { courseId }
    });
    
    // Delete course resources
    await prisma.resource.deleteMany({
      where: { courseId }
    });
    
    // Finally delete the course
    await prisma.course.delete({
      where: { courseId }
    });
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Add a review to a course
router.post('/:id/reviews', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { userId, rating, comment } = req.body;
    
    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { courseId }
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if user has already reviewed this course
    const existingReview = await prisma.courseReview.findFirst({
      where: {
        courseId,
        userId: parseInt(userId)
      }
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'User has already reviewed this course'
      });
    }
    
    // Create the review
    const review = await prisma.courseReview.create({
      data: {
        courseId,
        userId: parseInt(userId),
        rating: parseInt(rating),
        comment,
        createdAt: new Date()
      },
      include: {
        user: true
      }
    });
    
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
