
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getResourcesByBatch, deleteResource } from '@/lib/api';
import { Resource, Role } from '@/lib/types';
import { FileText, Download, Trash2, Plus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ResourceUploadModal from '../resources/ResourceUploadModal';

interface BatchResourcesProps {
  batchId: number;
  isInstructor: boolean;
  isAdmin: boolean;
}

const BatchResources = ({ batchId, isInstructor, isAdmin }: BatchResourcesProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const canEditResources = isAdmin || isInstructor;

  useEffect(() => {
    fetchResources();
  }, [batchId]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await getResourcesByBatch(batchId.toString());
      if (response.success && response.data) {
        setResources(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch resources',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;
    
    try {
      const response = await deleteResource(resourceToDelete.resourceId);
      
      if (response.success) {
        toast({
          title: 'Resource deleted',
          description: 'Resource has been deleted successfully',
        });
        setIsDeleteDialogOpen(false);
        setResourceToDelete(null);
        fetchResources();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete resource',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    fetchResources();
    toast({
      title: 'Resource uploaded',
      description: 'Resource has been uploaded successfully',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEditResources && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Resource
          </Button>
        </div>
      )}

      {resources.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No resources available for this batch yet.</p>
          {canEditResources && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Resource
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <Card key={resource.resourceId} className="overflow-hidden border-gray-200">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{resource.title}</h3>
                        <div className="text-sm text-muted-foreground">
                          Uploaded by {resource.uploadedBy?.fullName || 'Unknown'} on{' '}
                          {format(new Date(resource.createdAt), 'MMM d, yyyy')}
                        </div>
                        {resource.description && (
                          <p className="mt-2 text-sm text-gray-700">{resource.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={resource.presignedUrl || resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={resource.fileName}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>

                    {canEditResources && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setResourceToDelete(resource);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resource Upload Modal */}
      <ResourceUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        batchId={batchId}
        onSuccess={handleUploadSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteResource}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BatchResources;
