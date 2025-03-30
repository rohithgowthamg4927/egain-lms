
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { handleApiError } from './utils/errorHandler';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Direct route for getting user by ID
app.get('/api/users/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        profilePicture: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User with ID ${userId} not found`
      });
    }
    
    // Get courses related to this user
    const courses = [];
    if (user.role === 'student') {
      const studentCourses = await prisma.studentCourse.findMany({
        where: { studentId: userId },
        include: {
          course: true
        }
      });
      
      studentCourses.forEach(sc => {
        courses.push(sc.course);
      });
    }
    
    return res.json({
      success: true,
      data: {
        user,
        courses
      }
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

// Use API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((req, res) => {
  console.error(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.url}`
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
  console.log(`API endpoint at http://localhost:${PORT}/api`);
});
