
import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function uploadFileToS3(
  file: File,
  folder: string = 'uploads'
): Promise<string> {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    
    const params = {
      Bucket: import.meta.env.VITE_AWS_S3_BUCKET || 'lms-egain',
      Key: fileName,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read' as ObjectCannedACL,
    };

    await s3Client.send(new PutObjectCommand(params));
    
    // Return the public URL
    return `https://${params.Bucket}.s3.${import.meta.env.VITE_AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

export async function uploadProfilePicture(file: File, userId: number): Promise<string> {
  return uploadFileToS3(file, `profile-pictures/${userId}`);
}

export async function uploadCourseThumbnail(file: File, courseId: number): Promise<string> {
  return uploadFileToS3(file, `course-thumbnails/${courseId}`);
}

export async function uploadCourseResource(file: File, courseId: number): Promise<string> {
  return uploadFileToS3(file, `course-resources/${courseId}`);
}

export async function uploadClassRecording(file: File, batchId: number, scheduleId: number): Promise<string> {
  return uploadFileToS3(file, `class-recordings/${batchId}/${scheduleId}`);
}

export function getFileTypeFromUrl(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase();
  
  if (['mp4', 'webm', 'mov'].includes(extension || '')) {
    return 'video';
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
    return 'image';
  } else if (['pdf'].includes(extension || '')) {
    return 'pdf';
  } else if (['doc', 'docx'].includes(extension || '')) {
    return 'document';
  } else {
    return 'unknown';
  }
}
