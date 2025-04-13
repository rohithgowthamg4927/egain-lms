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

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  }
});

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
    const { key, uploadId, parts, batchId, title, description, uploadedById, resourceType } = req.body;
    
    if (!key || !uploadId || !parts || !batchId || !title || !uploadedById || !resourceType) {
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
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { batchId, title, description, resourceType, uploadedById } = req.body;
    const file = req.file;
    
    if (!file || !batchId || !title || !resourceType || !uploadedById) {
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
      resourceType, 
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
    
    res.json({ success: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

export default router;
