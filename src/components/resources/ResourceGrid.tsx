
import { Resource } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Download, Trash, FileText, Video, Code, Link as LinkIcon, File } from 'lucide-react';
import { getResourcePresignedUrl } from '@/lib/api/resources';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ResourceGridProps {
  resources: Resource[];
  onDelete?: (resource: Resource) => void;
  userRole?: string;
}

const ResourceGrid = ({ resources, onDelete, userRole }: ResourceGridProps) => {
  const { toast } = useToast();
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  // Get icon based on resource type
  const getResourceIcon = (type: string | undefined, fileName: string | undefined) => {
    const resourceType = getResourceType(type, fileName);
    
    switch (resourceType) {
      case 'document':
        return <FileText className="h-10 w-10 text-blue-500" />;
      case 'video':
        return <Video className="h-10 w-10 text-red-500" />;
      case 'code':
        return <Code className="h-10 w-10 text-purple-500" />;
      case 'link':
        return <LinkIcon className="h-10 w-10 text-green-500" />;
      case 'assignment':
        return <FileText className="h-10 w-10 text-amber-500" />;
      default:
        return <File className="h-10 w-10 text-gray-500" />;
    }
  };

  // Format date for display
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

  // Helper to determine if a resource is previewable
  const isPreviewable = (resource: Resource): boolean => {
    const type = getResourceType(resource.type, resource.fileName);
    return ['document', 'video', 'image'].includes(type);
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {resources.map((resource) => (
          <Card key={resource.resourceId} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2 flex flex-col items-center">
              {getResourceIcon(resource.type, resource.fileName)}
              <Badge 
                className="mt-2"
                variant="outline"
              >
                {getResourceType(resource.type, resource.fileName).charAt(0).toUpperCase() + 
                 getResourceType(resource.type, resource.fileName).slice(1)}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <CardTitle className="text-lg font-medium truncate text-center">
                {resource.title || 'Untitled Resource'}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-2 text-center">
                {resource.description || 'No description available'}
              </p>
              <p className="text-xs text-center mt-2 text-muted-foreground">
                Added: {formatDate(resource.createdAt)}
              </p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-center gap-2">
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
            </CardFooter>
          </Card>
        ))}
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

export default ResourceGrid;
