
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.CourseCategory.findMany();
    res.json({ success: true, data: categories });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get a specific category by ID
router.get('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const category = await prisma.CourseCategory.findUnique({
      where: { categoryId }
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({ success: true, data: category });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a new category
router.post('/', async (req, res) => {
  try {
    const { categoryName } = req.body;
    
    if (!categoryName) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }
    
    
    const category = await prisma.CourseCategory.create({
      data: { 
        categoryName,
      }
    });
    
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { categoryName } = req.body;
    
    const category = await prisma.CourseCategory.update({
      where: { categoryId },
      data: { categoryName }
    });
    
    res.json({ success: true, data: category });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    // Check if there are courses in this category
    const coursesCount = await prisma.Course.count({
      where: { categoryId }
    });
    
    if (coursesCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with associated courses'
      });
    }
    
    await prisma.CourseCategory.delete({
      where: { categoryId }
    });
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
