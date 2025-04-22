import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, X } from 'lucide-react';
import { Batch, InitiateUploadResponse, UploadPartResponse } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api/core';

interface UploadResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batches: Batch[];
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for multipart upload
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

export function UploadResourceDialog({
  isOpen,
  onClose,
  onSuccess,
  batches,
}: UploadResourceDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [resourceType, setResourceType] = useState<'assignment' | 'recording'>('assignment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 1GB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = resourceType === 'assignment'
      ? ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'rtf', 'odt']
      : ['mp4', 'mov', 'avi'];

    if (!extension || !validExtensions.includes(extension)) {
      toast({
        title: 'Invalid file type',
        description: `Please upload a valid ${resourceType} file`,
        variant: 'destructive',
      });
      return;
    }

    setCurrentFile(file);
    setTitle(file.name.split('.')[0]); // Set default title from filename
  }, [resourceType, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: resourceType === 'assignment'
      ? {
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'application/vnd.ms-powerpoint': ['.ppt'],
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
          'text/plain': ['.txt'],
          'application/rtf': ['.rtf'],
          'application/vnd.oasis.opendocument.text': ['.odt'],
          // Add more lenient MIME types
          'application/octet-stream': ['.doc', '.docx', '.pdf', '.ppt', '.pptx', '.txt', '.rtf', '.odt'],
        }
      : {
          'video/mp4': ['.mp4'],
          'video/quicktime': ['.mov'],
          'video/x-msvideo': ['.avi'],
        },
  });

  const handleUpload = async () => {
    if (!currentFile || !selectedBatch || !title || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);
    setTimeRemaining(0);

    try {
      const startTime = Date.now();
      let uploadedBytes = 0;
      let lastUploadedBytes = 0;
      let lastTime = startTime;

      // For small files, use direct upload
      if (currentFile.size <= CHUNK_SIZE) {
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('batchId', selectedBatch);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('resourceType', resourceType);
        formData.append('uploadedById', user.userId.toString());

        const { success, error } = await apiFetch('/resources/upload', {
          method: 'POST',
          body: formData,
        });

        if (!success) {
          throw new Error(error || 'Upload failed');
        }

        toast({
          title: 'Upload successful',
          description: 'Resource has been uploaded successfully',
        });
        onSuccess();
        onClose();
      } else {
        // For large files, use multipart upload
        const batch = batches.find(b => b.batchId.toString() === selectedBatch);
        if (!batch) throw new Error('Batch not found');

        // Initialize multipart upload
        const { success: initSuccess, data: initData, error: initError } = 
          await apiFetch<InitiateUploadResponse>('/resources/initiate-upload', {
          method: 'POST',
          body: JSON.stringify({
            batchName: batch.batchName,
            resourceType,
            fileName: currentFile.name,
          }),
        });

        if (!initSuccess || !initData) {
          throw new Error(initError || 'Failed to initialize upload');
        }

        // Upload parts
        const parts = [];
        const totalParts = Math.ceil(currentFile.size / CHUNK_SIZE);

        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
          const start = (partNumber - 1) * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, currentFile.size);
          const chunk = currentFile.slice(start, end);

          const formData = new FormData();
          formData.append('file', chunk);
          formData.append('key', initData.data.key);
          formData.append('uploadId', initData.data.uploadId);
          formData.append('partNumber', partNumber.toString());

          const { success: partSuccess, data: partData, error: partError } = 
            await apiFetch<UploadPartResponse>('/resources/upload-part', {
            method: 'POST',
            body: formData,
          });

          if (!partSuccess || !partData) {
            throw new Error(partError || 'Failed to upload part');
          }

          parts.push(partData);  // Push the entire partData object

          // Update progress
          uploadedBytes += chunk.size;
          const currentTime = Date.now();
          const timeDiff = (currentTime - lastTime) / 1000; // seconds
          if (timeDiff >= 1) { // Update speed every second
            const speed = (uploadedBytes - lastUploadedBytes) / timeDiff;
            setUploadSpeed(speed);
            lastUploadedBytes = uploadedBytes;
            lastTime = currentTime;
          }

          const progress = (uploadedBytes / currentFile.size) * 100;
          setUploadProgress(progress);

          const remainingBytes = currentFile.size - uploadedBytes;
          const remainingTime = remainingBytes / (uploadedBytes / ((currentTime - startTime) / 1000));
          setTimeRemaining(remainingTime);
        }

        // Complete multipart upload
        const { success: completeSuccess, error: completeError } = await apiFetch('/resources/complete-upload', {
          method: 'POST',
          body: JSON.stringify({
            key: initData.data.key,  
            uploadId: initData.data.uploadId, 
            parts,
            batchId: selectedBatch,
            title,
            description,
            uploadedById: user.userId,
            resourceType,
          }),
        });

        if (!completeSuccess) {
          throw new Error(completeError || 'Failed to complete upload');
        }

        toast({
          title: 'Upload successful',
          description: 'Resource has been uploaded successfully',
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An error occurred during upload',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (seconds: number) => {
    if (seconds === Infinity || isNaN(seconds)) return 'Calculating...';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload Resource</DialogTitle>
          <DialogDescription>
            Upload assignments or class recordings for your batch.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="batch">Batch</Label>
            <Select
              value={selectedBatch}
              onValueChange={setSelectedBatch}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                    {batch.batchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Resource Type</Label>
            <Select
              value={resourceType}
              onValueChange={(value: 'assignment' | 'recording') => setResourceType(value)}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="recording">Class Recording</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="grid gap-2">
            <Label>File</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              {currentFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">{currentFile.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ({formatFileSize(currentFile.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentFile(null);
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    {isDragActive ? (
                      <p>Drop the file here</p>
                    ) : (
                      <p>Drag & drop a file here, or click to select</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {resourceType === 'assignment'
                      ? 'Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, RTF, ODT'
                      : 'Supported formats: MP4, MOV, AVI'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Speed: {formatFileSize(uploadSpeed)}/s</span>
                <span>Time remaining: {formatTime(timeRemaining)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!currentFile || !selectedBatch || !title || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
