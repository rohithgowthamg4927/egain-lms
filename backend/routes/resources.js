import express from 'express';
import { PrismaClient } from '@prisma/client';
import { handleApiError } from '../utils/errorHandler.js';
import multer from 'multer';
import { 
  initiateMultipartUpload, 
  uploadPart, 
  completeMultipartUpload, 
  abortMultipartUpload,
  uploadFile,
  getPresignedUrl,
  deleteFile
} from '../utils/s3.js';
import emailService from '../services/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  }
});

// Add this error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  next(err);
};

// Helper to determine resource type from file name
function getResourceTypeFromFileName(fileName) {
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
  const ext = fileName.split('.').pop().toLowerCase();
  if (videoExtensions.includes(ext)) {
    return 'Class Recording';
  }
  return 'Assignment';
}

// Get all resources for a batch
router.get('/batch/:batchId', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    
    const resources = await prisma.Resource.findMany({
      where: { batchId },
      include: {
        batch: true,
        uploadedBy: {
          select: {
            userId: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Generate presigned URLs for each resource
    const resourcesWithUrls = await Promise.all(resources.map(async (resource) => {
      const presignedUrl = await getPresignedUrl(resource.fileUrl);
      return {
        ...resource,
        presignedUrl
      };
    }));
    
    res.json({ success: true, data: resourcesWithUrls });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Initialize multipart upload
router.post('/initiate-upload', async (req, res) => {
  try {
    const { batchName, resourceType, fileName } = req.body;
    
    if (!batchName || !resourceType || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'Batch name, resource type, and file name are required'
      });
    }
    
    const { uploadId, key } = await initiateMultipartUpload(batchName, resourceType, fileName);
    
    res.json({ 
      success: true, 
      data: { uploadId, key }
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Upload part
router.post('/upload-part', upload.single('file'), async (req, res) => {
  try {
    const { key, uploadId, partNumber } = req.body;
    const fileBuffer = req.file.buffer;
    
    if (!key || !uploadId || !partNumber || !fileBuffer) {
      return res.status(400).json({
        success: false,
        error: 'Key, upload ID, part number, and file are required'
      });
    }
    
    const result = await uploadPart(key, uploadId, parseInt(partNumber), fileBuffer);
    
    res.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Complete multipart upload
router.post('/complete-upload', async (req, res) => {
  try {
    const { key, uploadId, parts, batchId, title, description, uploadedById } = req.body;
    
    if (!key || !uploadId || !parts || !batchId || !title || !uploadedById) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Complete the multipart upload
    const fileUrl = await completeMultipartUpload(key, uploadId, parts);
    
    // Create resource record in database
    const resource = await prisma.Resource.create({
      data: {
        title,
        description,
        fileName: key.split('/').pop(),
        fileUrl: key,
        batchId: parseInt(batchId),
        uploadedById: parseInt(uploadedById),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        batch: {
          include: { course: true }
        },
        uploadedBy: {
          select: {
            userId: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    // Send email to all students in the batch
    const students = await prisma.StudentBatch.findMany({
      where: { batchId: parseInt(batchId) },
      include: { student: true }
    });
    const studentUsers = students.map(sb => sb.student).filter(Boolean);
    const resourceType = getResourceTypeFromFileName(resource.fileName);
    await emailService.sendResourceUploadEmail({
      students: studentUsers,
      batch: resource.batch,
      course: resource.batch.course,
      resource,
      resourceType
    });
    
    res.json({ 
      success: true, 
      data: {
        ...resource,
        presignedUrl: fileUrl
      }
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Abort multipart upload
router.post('/abort-upload', async (req, res) => {
  try {
    const { key, uploadId } = req.body;
    
    if (!key || !uploadId) {
      return res.status(400).json({
        success: false,
        error: 'Key and upload ID are required'
      });
    }
    
    await abortMultipartUpload(key, uploadId);
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Upload small file directly
router.post('/upload', upload.single('file'), handleMulterError, async (req, res) => {
  try {
    const { batchId, title, description, resourceType: resourceTypeFromBody, uploadedById } = req.body;
    const file = req.file;
    
    if (!file || !batchId || !title || !resourceTypeFromBody || !uploadedById) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Get batch name for S3 path
    const batch = await prisma.Batch.findUnique({
      where: { batchId: parseInt(batchId) }
    });
    
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }
    
    // Upload to S3 with correct path based on resource type
    const fileUrl = await uploadFile(
      batch.batchName, 
      resourceTypeFromBody, 
      file.originalname, 
      file.buffer
    );
    
    // Create resource record in database
    const resource = await prisma.Resource.create({
      data: {
        title,
        description,
        fileName: file.originalname,
        fileUrl: fileUrl,
        batchId: parseInt(batchId),
        uploadedById: parseInt(uploadedById),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        batch: {
          include: { course: true }
        },
        uploadedBy: {
          select: {
            userId: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    // Send email to all students in the batch
    const students = await prisma.StudentBatch.findMany({
      where: { batchId: parseInt(batchId) },
      include: { student: true }
    });
    const studentUsers = students.map(sb => sb.student).filter(Boolean);
    const emailResourceType = getResourceTypeFromFileName(resource.fileName);
    await emailService.sendResourceUploadEmail({
      students: studentUsers,
      batch: resource.batch,
      course: resource.batch.course,
      resource,
      resourceType: emailResourceType
    });
    
    res.json({ 
      success: true, 
      data: resource
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Get resource by ID
router.get('/:id', async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    
    const resource = await prisma.Resource.findUnique({
      where: { resourceId },
      include: {
        batch: true,
        uploadedBy: {
          select: {
            userId: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }
    
    // Generate presigned URL
    const presignedUrl = await getPresignedUrl(resource.fileUrl);
    
    res.json({ 
      success: true, 
      data: {
        ...resource,
        presignedUrl
      }
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Update resource
router.put('/:id', async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const { title, description } = req.body;
    
    const resource = await prisma.Resource.update({
      where: { resourceId },
      data: {
        title,
        description,
        updatedAt: new Date()
      },
      include: {
        batch: true,
        uploadedBy: {
          select: {
            userId: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    res.json({ success: true, data: resource });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Delete resource
router.delete('/:id', async (req, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    
    // First, get the resource to get the fileUrl
    const resource = await prisma.Resource.findUnique({
      where: { resourceId }
    });
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }
    
    // Delete the file from S3 if it exists
    if (resource.fileUrl) {
      try {
        await deleteFile(resource.fileUrl);
      } catch (s3Error) {
      }
    }
    
    // Delete the resource from the database
    await prisma.Resource.delete({
      where: { resourceId }
    });
    
    // 1. Fetch all resources for the batch
    const batchId = resource.batchId;
    const resources = await prisma.Resource.findMany({ where: { batchId }, orderBy: { createdAt: 'asc' } });
    const intervalsWithResources = new Set();
    resources.forEach((r, idx) => {
      const interval = Math.floor(idx / 5) + 1;
      intervalsWithResources.add(interval);
    });
    // 2. Find all feedback intervals for this batch
    const feedbacks = await prisma.BatchFeedback.findMany({ where: { batchId } });
    const feedbackIntervals = new Set(feedbacks.map(fb => fb.interval));
    // 3. Delete feedbacks for intervals that no longer have resources
    for (const interval of feedbackIntervals) {
      if (!intervalsWithResources.has(interval)) {
        await prisma.BatchFeedback.deleteMany({ where: { batchId, interval } });
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// --- FEEDBACK GATING ENDPOINTS ---

// 1. Check if feedback is required for a student in a batch
router.get('/batches/:batchId/feedback-required', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    const studentId = parseInt(req.query.studentId);
    if (!batchId || !studentId) {
      return res.status(400).json({ success: false, error: 'batchId and studentId are required' });
    }

    // Fetch all resources for the batch, oldest first
    const resources = await prisma.Resource.findMany({
      where: { batchId },
      orderBy: { createdAt: 'asc' }
    });
    const resourceCount = resources.length;
    // If less than 6 resources, no feedback required
    if (resourceCount < 6) {
      return res.json({ success: true, feedbackRequired: false, interval: 1 });
    }
    // Calculate current interval
    const interval = Math.floor((resourceCount - 1) / 5) + 1;
    const requiredFeedbackInterval = interval - 1;
    // Check if feedback for previous interval exists
    const feedback = await prisma.BatchFeedback.findUnique({
      where: {
        batchId_studentId_interval: {
          batchId,
          studentId,
          interval: requiredFeedbackInterval
        }
      }
    });
    if (feedback) {
      return res.json({ success: true, feedbackRequired: false, interval });
    } else {
      return res.json({ success: true, feedbackRequired: true, interval, missingInterval: requiredFeedbackInterval });
    }
  } catch (error) {
    handleApiError(res, error);
  }
});

// 2. Submit or edit feedback for a batch/interval
router.post('/batches/:batchId/feedback', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    const { studentId, interval, rating, feedback } = req.body;
    if (!batchId || !studentId || !interval || !rating || !feedback) {
      return res.status(400).json({ success: false, error: 'batchId, studentId, interval, rating, and feedback are required' });
    }
    // Check if already exists
    const existing = await prisma.BatchFeedback.findUnique({
      where: {
        batchId_studentId_interval: {
          batchId,
          studentId,
          interval
        }
      }
    });
    if (existing) {
      // Update feedback
      const updated = await prisma.BatchFeedback.update({
        where: {
          batchId_studentId_interval: {
            batchId,
            studentId,
            interval
          }
        },
        data: {
          rating,
          feedback,
          updatedAt: new Date()
        }
      });
      return res.json({ success: true, data: updated, updated: true });
    }
    // Create feedback
    const newFeedback = await prisma.BatchFeedback.create({
      data: {
        batchId,
        studentId,
        interval,
        rating,
        feedback
      }
    });
    res.status(201).json({ success: true, data: newFeedback, created: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

// 3. Admin: Get all feedback for a batch
router.get('/batches/:batchId/feedbacks', async (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    if (!batchId) {
      return res.status(400).json({ success: false, error: 'batchId is required' });
    }
    const feedbacks = await prisma.BatchFeedback.findMany({
      where: { batchId },
      include: {
        student: {
          select: { userId: true, fullName: true, email: true }
        }
      },
      orderBy: [{ interval: 'asc' }, { createdAt: 'asc' }]
    });
    res.json({ success: true, data: feedbacks });
  } catch (error) {
    handleApiError(res, error);
  }
});

// Bulk delete resources
router.post('/bulk-delete', async (req, res) => {
  try {
    const { resourceIds } = req.body;
    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ success: false, error: 'resourceIds array is required' });
    }

    // Fetch all resources to be deleted
    const resources = await prisma.Resource.findMany({
      where: { resourceId: { in: resourceIds } }
    });
    if (resources.length === 0) {
      return res.status(404).json({ success: false, error: 'No resources found for the given IDs' });
    }

    // Group resources by batchId
    const batchMap = {};
    for (const resource of resources) {
      if (!batchMap[resource.batchId]) batchMap[resource.batchId] = [];
      batchMap[resource.batchId].push(resource);
    }

    // Delete files from S3
    for (const resource of resources) {
      if (resource.fileUrl) {
        try {
          await deleteFile(resource.fileUrl);
        } catch (e) {}
      }
    }

    // Delete resources from DB
    await prisma.Resource.deleteMany({ where: { resourceId: { in: resourceIds } } });

    // For each affected batch, cleanup feedback
    for (const batchId of Object.keys(batchMap)) {
      const batchIdNum = parseInt(batchId);
      // Fetch remaining resources for the batch
      const remaining = await prisma.Resource.findMany({ where: { batchId: batchIdNum }, orderBy: { createdAt: 'asc' } });
      if (remaining.length === 0) {
        // If no resources left, delete all feedback for this batch
        await prisma.BatchFeedback.deleteMany({ where: { batchId: batchIdNum } });
      } else {
        // Otherwise, delete feedback for intervals with no resources
        const intervalsWithResources = new Set();
        remaining.forEach((r, idx) => {
          const interval = Math.floor(idx / 5) + 1;
          intervalsWithResources.add(interval);
        });
        const feedbacks = await prisma.BatchFeedback.findMany({ where: { batchId: batchIdNum } });
        const feedbackIntervals = new Set(feedbacks.map(fb => fb.interval));
        for (const interval of feedbackIntervals) {
          if (!intervalsWithResources.has(interval)) {
            await prisma.BatchFeedback.deleteMany({ where: { batchId: batchIdNum, interval } });
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
