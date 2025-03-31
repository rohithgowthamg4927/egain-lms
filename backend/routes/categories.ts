
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.courseCategory.findMany();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get a specific category by ID
router.get('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const category = await prisma.courseCategory.findUnique({
      where: { categoryId }
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Create a category
router.post('/', async (req, res) => {
  try {
    const { categoryName } = req.body;
    
    if (!categoryName) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }
    
    console.log(`Creating category with name: ${categoryName}`);
    
    const newCategory = await prisma.courseCategory.create({
      data: { categoryName }
    });
    
    console.log('Category created:', newCategory);
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    handleApiError(res, error);
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { categoryName } = req.body;
    
    const category = await prisma.courseCategory.update({
      where: { categoryId },
      data: { categoryName }
    });
    
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    // Check if there are courses in this category
    const coursesCount = await prisma.course.count({
      where: { categoryId }
    });
    
    if (coursesCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with associated courses'
      });
    }
    
    await prisma.courseCategory.delete({
      where: { categoryId }
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
