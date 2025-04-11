
import { Resource } from '@/lib/types';
import { apiFetch } from './core';

export const uploadResource = async (
  batchId: number,
  resourceName: string,
  file: File,
  resourceType: string,
  description?: string
): Promise<{ success: boolean; data?: Resource; error?: string }> => {
  try {
    // First, get the pre-signed URL from the server
    const presignedUrlResponse = await apiFetch<{ url: string, key: string }>('/resources/presigned-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type
      })
    });

    if (!presignedUrlResponse.success || !presignedUrlResponse.data) {
      throw new Error(presignedUrlResponse.error || 'Failed to get upload URL');
    }

    // Upload the file to S3 using the pre-signed URL
    const uploadResponse = await fetch(presignedUrlResponse.data.url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Create the resource in the database
    const resourceResponse = await apiFetch<Resource>('/resources', {
      method: 'POST',
      body: JSON.stringify({
        batchId,
        resourceName,
        resourceType,
        description,
        fileKey: presignedUrlResponse.data.key,
        fileType: file.type,
        fileName: file.name
      })
    });

    return resourceResponse;
  } catch (error) {
    console.error('Error uploading resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload resource'
    };
  }
};

export const getResources = async (): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  try {
    const response = await apiFetch<Resource[]>('/resources');
    return response;
  } catch (error) {
    console.error('Error fetching resources:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch resources'
    };
  }
};

export const getResourcesByBatch = async (batchId: number): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  try {
    const response = await apiFetch<Resource[]>(`/resources/batch/${batchId}`);
    return response;
  } catch (error) {
    console.error(`Error fetching resources for batch ${batchId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch batch resources'
    };
  }
};

export const getStudentResources = async (
  studentId: number, 
  batchId?: number
): Promise<{ success: boolean; data?: Resource[]; error?: string }> => {
  try {
    let url = `/resources/student/${studentId}`;
    if (batchId) {
      url += `?batchId=${batchId}`;
    }
    
    const response = await apiFetch<Resource[]>(url);
    return response;
  } catch (error) {
    console.error(`Error fetching resources for student ${studentId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch student resources'
    };
  }
};

export const deleteResource = async (resourceId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await apiFetch(`/resources/${resourceId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error(`Error deleting resource ${resourceId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete resource'
    };
  }
};

export const getResourceDownloadUrl = async (resourceId: number): Promise<{ success: boolean; data?: { url: string }; error?: string }> => {
  try {
    const response = await apiFetch<{ url: string }>(`/resources/${resourceId}/download`);
    return response;
  } catch (error) {
    console.error(`Error getting download URL for resource ${resourceId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get download URL'
    };
  }
};

// Add the missing getResourcePresignedUrl function
export const getResourcePresignedUrl = async (resourceId: number): Promise<{ success: boolean; data?: { presignedUrl: string }; error?: string }> => {
  try {
    const response = await apiFetch<{ presignedUrl: string }>(`/resources/${resourceId}/presigned-url`);
    return response;
  } catch (error) {
    console.error(`Error getting presigned URL for resource ${resourceId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get presigned URL'
    };
  }
};

// Add createResource function for Resources.tsx
export const createResource = async (resource: Partial<Resource>): Promise<{ success: boolean; data?: Resource; error?: string }> => {
  try {
    const response = await apiFetch<Resource>('/resources', {
      method: 'POST',
      body: JSON.stringify(resource)
    });
    return response;
  } catch (error) {
    console.error('Error creating resource:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create resource'
    };
  }
};
