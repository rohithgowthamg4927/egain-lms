
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        category: true,
        reviews: true,
        batches: true,
        studentCourses: true
      }
    });
    
    const enrichedCourses = courses.map(course => ({
      ...course,
      students: course.studentCourses.length,
      batches: course.batches.length,
      averageRating: course.reviews.length > 0 
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length 
        : null
    }));
    
    res.status(200).json({ success: true, data: enrichedCourses });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get a specific course
router.get('/:courseId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    
    const course = await prisma.course.findUnique({
      where: { courseId },
      include: {
        category: true,
        reviews: true,
        batches: true,
        studentCourses: true,
        resources: true
      }
    });
    
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    
    const enrichedCourse = {
      ...course,
      students: course.studentCourses.length,
      batches: course.batches.length,
      averageRating: course.reviews.length > 0 
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length 
        : null
    };
    
    res.status(200).json({ success: true, data: enrichedCourse });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a course
router.post('/', async (req, res) => {
  try {
    console.log("Creating course with data:", req.body);
    const courseData = req.body;
    
    // Validate that the required fields exist
    if (!courseData.courseName || !courseData.categoryId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Required fields missing: courseName and categoryId are required' 
      });
    }
    
    // Make sure categoryId is a number
    const categoryId = parseInt(courseData.categoryId);
    if (isNaN(categoryId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid categoryId - must be a number' 
      });
    }
    
    // Create the course
    const newCourse = await prisma.course.create({
      data: {
        courseName: courseData.courseName,
        description: courseData.description,
        courseLevel: courseData.courseLevel,
        categoryId: categoryId,
        isPublished: courseData.isPublished !== undefined ? courseData.isPublished : true,
        thumbnailUrl: courseData.thumbnailUrl
      },
      include: { category: true }
    });
    
    console.log("Course created successfully:", newCourse);
    
    res.status(201).json({ success: true, data: newCourse });
  } catch (error) {
    console.error("Error creating course:", error);
    handleApiError(res, error);
  }
});

// Update course
router.put('/:courseId', async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const courseData = req.body;
    
    const updatedCourse = await prisma.course.update({
      where: { courseId },
      data: courseData,
      include: { category: true }
    });
    
    res.status(200).json({ success: true, data: updatedCourse });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
