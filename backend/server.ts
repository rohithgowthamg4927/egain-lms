
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

// Direct handler for user requests since the route might be missing in the router
app.get('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    console.log(`Processing GET request for user with ID: ${userId}`);
    
    const user = await prisma.user.findUnique({
      where: { userId },
      include: { profilePicture: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User with ID ${userId} not found`
      });
    }
    
    console.log(`Found user:`, user);
    
    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
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
