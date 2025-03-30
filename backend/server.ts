
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Use API routes
app.use('/api', apiRoutes);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
