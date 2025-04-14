import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await prisma.Course.findMany({
      include: {
        category: true,
        _count: {
          select: {
            studentCourses: true,
            batches: true,
          },
        },
      },
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
    
    if (isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }
    
    const course = await prisma.Course.findUnique({
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
            schedules: true
          }
        },
        instructorCourses: {
          include: {
            instructor: true
          }
        },
        _count: {
          select: {
            studentCourses: true,
            batches: true,
          },
        },
      }
    });

    const averageRating = course.reviews.length > 0 
    ? course.reviews.reduce((acc, review) => acc + review.rating, 0) / course.reviews.length 
    : null;

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Include the average rating in the response
    res.json({ 
      success: true, 
      data: {
        ...course,
        averageRating
      } 
    });
    
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a new course
router.post('/', async (req, res) => {
  try {
    const {
      courseName,
      description,
      courseLevel,
      categoryId,
      isPublished,
      thumbnailUrl
    } = req.body;
    
    // Validate that required fields exist
    if (!courseName || !categoryId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Required fields missing: courseName and categoryId are required' 
      });
    }
    
    const course = await prisma.Course.create({
      data: {
        courseName,
        description,
        courseLevel,
        categoryId: parseInt(categoryId),
        isPublished: isPublished !== undefined ? isPublished : false,
        thumbnailUrl,
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
    if (isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }
    
    const { 
      courseName, 
      description, 
      courseLevel,
      categoryId,
      isPublished,
      thumbnailUrl
    } = req.body;
    
    // Check if course exists
    const existingCourse = await prisma.Course.findUnique({
      where: { courseId }
    });
    
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    const course = await prisma.Course.update({
      where: { courseId },
      data: {
        ...(courseName !== undefined && { courseName }),
        ...(description !== undefined && { description }),
        ...(courseLevel !== undefined && { courseLevel }),
        ...(categoryId !== undefined && { categoryId: parseInt(categoryId) }),
        ...(isPublished !== undefined && { isPublished }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl })
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
    if (isNaN(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format'
      });
    }
    
    // Check if course exists
    const existingCourse = await prisma.Course.findUnique({
      where: { courseId }
    });
    
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if there are batches for this course
    const batchesCount = await prisma.Batch.count({
      where: { courseId }
    });
    
    if (batchesCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete course with active batches'
      });
    }
    
    // Delete student enrollments if they exist
    const studentCoursesCount = await prisma.StudentCourse.count({
      where: { courseId }
    });
    
    if (studentCoursesCount > 0) {
      await prisma.StudentCourse.deleteMany({
        where: { courseId }
      });
    }
    
    // Delete course reviews if they exist
    const reviewsCount = await prisma.CourseReview.count({
      where: { courseId }
    });
    
    if (reviewsCount > 0) {
      await prisma.CourseReview.deleteMany({
        where: { courseId }
      });
    }
    
    // Check for resources related to this course
    const resources = await prisma.Resource.findMany({
      where: {
        batch: {
          courseId
        }
      }
    });
    
    if (resources.length > 0) {
      // Delete resources one by one to avoid relation errors
      for (const resource of resources) {
        await prisma.Resource.delete({
          where: { resourceId: resource.resourceId }
        });
      }
    }
    
    // Finally delete the course
    await prisma.Course.delete({
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
    const { userId, rating, review } = req.body;
    
    // Check if course exists
    const course = await prisma.Course.findUnique({
      where: { courseId }
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if user has already reviewed this course
    const existingReview = await prisma.CourseReview.findFirst({
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
    const createdReview = await prisma.CourseReview.create({
      data: {
        course: { connect: { courseId } },
        user: { connect: { userId: parseInt(userId) } },
        rating: parseInt(rating),
        review,
        createdAt: new Date()
      },
      include: {
        user: true
      }
    });
    
    res.status(201).json({ success: true, data: createdReview });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update a review
router.put('/:id/reviews/:reviewId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const reviewId = parseInt(req.params.reviewId);
    const { userId, rating, review } = req.body;
    
    // Check if course exists
    const course = await prisma.Course.findUnique({
      where: { courseId }
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if review exists and belongs to the user
    const existingReview = await prisma.CourseReview.findFirst({
      where: {
        reviewId,
        courseId,
        userId: parseInt(userId)
      }
    });
    
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        error: 'Review not found or you do not have permission to edit this review'
      });
    }
    
    // Update the review
    const updatedReview = await prisma.CourseReview.update({
      where: { reviewId },
      data: {
        rating: parseInt(rating),
        review,
        updatedAt: new Date()
      },
      include: {
        user: true
      }
    });
    
    res.json({ success: true, data: updatedReview });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete a review
router.delete('/:id/reviews/:reviewId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const reviewId = parseInt(req.params.reviewId);
    const { userId } = req.body;
    
    // Check if course exists
    const course = await prisma.Course.findUnique({
      where: { courseId }
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    // Check if review exists and belongs to the user
    const existingReview = await prisma.CourseReview.findFirst({
      where: {
        reviewId,
        courseId,
        userId: parseInt(userId)
      }
    });
    
    if (!existingReview) {
      return res.status(404).json({
        success: false,
        error: 'Review not found or you do not have permission to delete this review'
      });
    }
    
    // Delete the review
    await prisma.CourseReview.delete({
      where: { reviewId }
    });
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
