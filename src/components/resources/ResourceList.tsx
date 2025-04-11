
import { Resource } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash, Eye } from 'lucide-react';
import { getResourcePresignedUrl } from '@/lib/api/resources';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ResourceListProps {
  resources: Resource[];
  onDelete?: (resource: Resource) => void;
  userRole?: string;
}

const ResourceList = ({ resources, onDelete, userRole }: ResourceListProps) => {
  const { toast } = useToast();
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const getResourceTypeColor = (type: string | undefined, fileName: string | undefined) => {
    // First determine the resource type based on file extension and type field
    const resourceType = getResourceType(type, fileName);
    
    const resourceTypeColors = {
      'document': 'bg-blue-100 hover:bg-blue-200 text-blue-800',
      'video': 'bg-red-100 hover:bg-red-200 text-red-800',
      'assignment': 'bg-amber-100 hover:bg-amber-200 text-amber-800',
      'link': 'bg-green-100 hover:bg-green-200 text-green-800',
      'code': 'bg-purple-100 hover:bg-purple-200 text-purple-800',
    };

    return resourceTypeColors[resourceType as keyof typeof resourceTypeColors] || 'bg-gray-100 hover:bg-gray-200 text-gray-800';
  };

  // Helper to determine resource type based on file extension and type field
  const getResourceType = (type: string | undefined, fileName: string | undefined): string => {
    if (!fileName) return type || 'document';
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (type === 'recording' || type === 'video' || 
        extension === 'mp4' || extension === 'mov' || extension === 'avi') {
      return 'video';
    }
    
    if (type === 'assignment' || type === 'document' ||
        ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(extension || '')) {
      return type === 'assignment' ? 'assignment' : 'document';
    }
    
    return type || 'document';
  };

  const formatTitle = (title: string | undefined) => {
    return title || 'Untitled Resource';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Check if user is an instructor or admin
  const canDelete = userRole === 'instructor' || userRole === 'admin';

  const handlePreview = async (resource: Resource) => {
    try {
      const response = await getResourcePresignedUrl(resource.resourceId);
      if (response.success && response.data?.presignedUrl) {
        setPreviewResource(resource);
        setPreviewUrl(response.data.presignedUrl);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to get preview URL',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to preview resource',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      const response = await getResourcePresignedUrl(resource.resourceId);
      if (response.success && response.data?.presignedUrl) {
        // Open in a new tab to download
        window.open(response.data.presignedUrl, '_blank');
      } else {
        toast({
          title: 'Error',
          description: 'Failed to get download URL',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download resource',
        variant: 'destructive',
      });
    }
  };

  // Helper to determine if a resource is previewable
  const isPreviewable = (resource: Resource): boolean => {
    const type = getResourceType(resource.type, resource.fileName);
    return ['document', 'video', 'image'].includes(type);
  };

  // Helper to render the appropriate preview component based on resource type
  const renderPreview = () => {
    if (!previewResource || !previewUrl) return null;
    
    const type = getResourceType(previewResource.type, previewResource.fileName);
    
    switch (type) {
      case 'video':
        return (
          <video 
            controls 
            className="w-full max-h-[70vh] rounded-md" 
            src={previewUrl}
          >
            Your browser does not support video playback.
          </video>
        );
      case 'document':
        // For PDF documents
        if (previewResource.fileName?.toLowerCase().endsWith('.pdf')) {
          return (
            <iframe 
              src={`${previewUrl}#view=FitH`} 
              className="w-full h-[70vh] rounded-md" 
              title={previewResource.title}
            />
          );
        }
        // For other documents, show a download button
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <p className="mb-4 text-center">
              This document cannot be previewed directly. Please download to view.
            </p>
            <Button onClick={() => handleDownload(previewResource)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <p className="mb-4 text-center">Preview not available for this resource type.</p>
            <Button onClick={() => handleDownload(previewResource)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        );
    }
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Description</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Added On</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.resourceId} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  <div className="font-medium">
                    {formatTitle(resource.title)}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <Badge
                    variant="outline"
                    className={getResourceTypeColor(resource.type, resource.fileName)}
                  >
                    {getResourceType(resource.type, resource.fileName).charAt(0).toUpperCase() + 
                     getResourceType(resource.type, resource.fileName).slice(1)}
                  </Badge>
                </td>
                <td className="py-3 px-4 max-w-[300px] truncate hidden md:table-cell">
                  {resource.description || "No description available"}
                </td>
                <td className="py-3 px-4 hidden sm:table-cell">
                  {formatDate(resource.createdAt)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    {isPreviewable(resource) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(resource)}
                        title="Preview Resource"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(resource)}
                      title="Download Resource"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive hover:bg-destructive/10"
                        onClick={() => onDelete?.(resource)}
                        title="Delete Resource"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resource Preview Dialog */}
      <Dialog 
        open={!!previewResource} 
        onOpenChange={(open) => {
          if (!open) {
            setPreviewResource(null);
            setPreviewUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewResource?.title}</DialogTitle>
            <DialogDescription>
              {previewResource?.description || 'No description available'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {renderPreview()}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                if (previewResource) handleDownload(previewResource);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ResourceList;
