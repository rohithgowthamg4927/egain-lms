
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
    
    console.log(`Fetching course details for ID: ${courseId}`);
    
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
        _count: {
          select: {
            studentCourses: true,
            batches: true,
          },
        },
      }
    });
    
    if (!course) {
      console.log(`Course with ID ${courseId} not found`);
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }
    
    console.log(`Course found:`, { courseId: course.courseId, courseName: course.courseName });
    res.json({ success: true, data: course });
  } catch (error) {
    console.error(`Error in GET /courses/:id:`, error);
    handleApiError(res, error);
  }
});

// Create a new course
router.post('/', async (req, res) => {
  try {
    console.log("Creating course with data:", req.body);
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
    
    console.log("Course created successfully:", course);
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    console.error("Error creating course:", error);
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
    
    console.log(`Updating course ${courseId} with data:`, req.body);
    
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
    console.error(`Error updating course:`, error);
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
    
    console.log(`Attempting to delete course ${courseId}`);
    
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
      console.log(`Deleting ${studentCoursesCount} student enrollments for course ${courseId}`);
      await prisma.StudentCourse.deleteMany({
        where: { courseId }
      });
    }
    
    // Delete course reviews if they exist
    const reviewsCount = await prisma.CourseReview.count({
      where: { courseId }
    });
    
    if (reviewsCount > 0) {
      console.log(`Deleting ${reviewsCount} reviews for course ${courseId}`);
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
      console.log(`Deleting ${resources.length} resources for course ${courseId}`);
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
    
    console.log(`Course ${courseId} deleted successfully`);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error deleting course:`, error);
    handleApiError(res, error);
  }
});

// Add a review to a course
router.post('/:id/reviews', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    const { userId, rating, comment } = req.body;
    
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
