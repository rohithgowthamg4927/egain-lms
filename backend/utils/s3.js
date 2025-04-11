import { 
  S3Client, 
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

// Helper to generate S3 key based on batch and resource type
const generateS3Key = (batchName, resourceType, fileName) => {
  const sanitizedBatchName = batchName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const basePath = resourceType === 'assignment' 
    ? `resources/assignments/${sanitizedBatchName}/pdf_files`
    : `resources/recordings/${sanitizedBatchName}/recordings`;
  
  return `${basePath}/${fileName}`;
};

// Initialize multipart upload
export const initiateMultipartUpload = async (batchName, resourceType, fileName) => {
  if (!BUCKET_NAME) {
    throw new Error('AWS S3 bucket name is not configured');
  }

  const key = generateS3Key(batchName, resourceType, fileName);
  console.log('Generated S3 key:', key);
  
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: getContentType(fileName),
  });

  try {
    console.log('Sending CreateMultipartUploadCommand to S3...');
    const response = await s3Client.send(command);
    console.log('S3 response:', response);
    
    if (!response.UploadId) {
      throw new Error('Failed to get upload ID from S3');
    }
    
    return {
      uploadId: response.UploadId,
      key: key,
    };
  } catch (error) {
    console.error('Error initiating multipart upload:', error);
    if (error.name === 'NoSuchBucket') {
      throw new Error(`S3 bucket '${BUCKET_NAME}' does not exist`);
    } else if (error.name === 'AccessDenied') {
      throw new Error('Access denied to S3 bucket. Check IAM permissions');
    }
    throw error;
  }
};

// Upload a part
export const uploadPart = async (key, uploadId, partNumber, body) => {
  const command = new UploadPartCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: body,
  });

  try {
    const response = await s3Client.send(command);
    return {
      ETag: response.ETag,
      PartNumber: partNumber,
    };
  } catch (error) {
    console.error('Error uploading part:', error);
    throw error;
  }
};

// Complete multipart upload
export const completeMultipartUpload = async (key, uploadId, parts) => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts,
    },
  });

  try {
    const response = await s3Client.send(command);
    return response.Location;
  } catch (error) {
    console.error('Error completing multipart upload:', error);
    throw error;
  }
};

// Abort multipart upload
export const abortMultipartUpload = async (key, uploadId) => {
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
  });

  try {
    await s3Client.send(command);
  } catch (error) {
    console.error('Error aborting multipart upload:', error);
    throw error;
  }
};

// Upload small file directly
export const uploadFile = async (batchName, resourceType, fileName, fileBuffer) => {
  const key = generateS3Key(batchName, resourceType, fileName);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: getContentType(fileName),
  });

  try {
    await s3Client.send(command);
    return key;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Generate presigned URL for downloading/streaming
export const getPresignedUrl = async (key, expiresIn = 7200) => {  
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  //pre-signed url expires in 2 hours.

  try {
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
};

// Helper to determine content type
const getContentType = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const contentTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
  };
  return contentTypes[extension] || 'application/octet-stream';
};

// Delete a file from S3
export const deleteFile = async (fileUrl) => {
  if (!BUCKET_NAME) {
    throw new Error('AWS S3 bucket name is not configured');
  }

  try {
    let key;
    
    // Check if fileUrl is a full S3 URL or just the key
    if (fileUrl.startsWith('http')) {
      // Extract the key from the fileUrl
      const urlParts = fileUrl.split(`https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`);
      if (urlParts.length !== 2) {
        console.log('Processing as direct key because URL format is not recognized');
        key = fileUrl; // Use fileUrl as key directly if it's not in the expected format
      } else {
        key = urlParts[1];
      }
    } else {
      // fileUrl is already the key
      key = fileUrl;
    }
    
    console.log('Deleting S3 object with key:', key);
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log('S3 object deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting S3 object:', error);
    throw error;
  }
};
