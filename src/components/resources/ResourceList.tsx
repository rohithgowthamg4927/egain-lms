import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Eye, Loader2, FileVideo, FileText, FileImage, FileAudio, File, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getResourcePresignedUrl } from '@/lib/api/resources';
import { Resource } from '@/lib/types';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface ResourceListProps {
  resources: Resource[];
  onDelete: (resource: Resource) => void;
  userRole?: string;
  selectedResourceIds?: number[];
  onSelectResource?: (resourceId: number, checked: boolean) => void;
}

export function ResourceList({ resources, onDelete, userRole, selectedResourceIds, onSelectResource }: ResourceListProps) {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const canDelete = userRole === 'instructor' || userRole === 'admin';
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  const totalPages = Math.ceil(resources.length / entriesPerPage);
  const paginatedResources = resources.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const getResourceType = (resource: Resource): string => {
    const fileName = resource.fileName?.toLowerCase() || '';
    const type = resource.type?.toLowerCase() || '';
    
    // Check if it's a video file by extension or type
    if (fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi') || 
        type === 'recording' || type === 'video') {
      return 'Class Recording';
    } else if (fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx') || 
             fileName.endsWith('.ppt') || fileName.endsWith('.pptx') || fileName.endsWith('.txt') || 
             type === 'assignment' || type === 'document') {
      return 'Assignment';
    } else {
      return 'Assignment';
    }
  };

  const isVideoResource = (resource: Resource): boolean => {
    const fileName = resource.fileName?.toLowerCase() || '';
    const extension = fileName.split('.').pop();
    const type = resource.type?.toLowerCase() || '';
    
    return type === 'recording' || 
           ['mp4', 'mov', 'avi', 'webm'].includes(extension || '');
  };

  const getFileIcon = (resource: Resource) => {
    const fileName = resource.fileName || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const resourceType = resource.resourceType || 'document';
    
    if (resourceType === 'recording' || ['mp4', 'mov', 'avi', 'webm'].includes(extension)) {
      return <FileVideo className="h-6 w-6 text-red-500" />;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <FileImage className="h-6 w-6 text-green-500" />;
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return <FileAudio className="h-6 w-6 text-purple-500" />; 
    } else if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(extension)) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleDownload = async (resourceId: number) => {
    try {
      setIsDownloading(true);
      setDownloadingId(resourceId);
      const response = await getResourcePresignedUrl(resourceId);
      
      if (response.success && response.data.presignedUrl) {
        window.open(response.data.presignedUrl, '_blank');
      } else {
        throw new Error(response.error || 'Failed to get download URL');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download resource',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
      setIsDownloading(false);
    }
  };

  const handleDeleteClick = (resource: Resource) => {
    setResourceToDelete(resource);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (resourceToDelete && onDelete) {
      try {
        await Promise.resolve(onDelete(resourceToDelete));
        setShowDeleteDialog(false);
        setResourceToDelete(null);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete resource',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedResources.map((resource) => (
            <TableRow key={resource.resourceId}>
              <TableCell className="w-12">
                <Checkbox
                  checked={selectedResourceIds?.includes(resource.resourceId) || false}
                  onCheckedChange={checked => onSelectResource?.(resource.resourceId, !!checked)}
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getFileIcon(resource)}
                  <span className="truncate max-w-[220px]">{resource.title || resource.fileName || `Resource ${resource.resourceId}`}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={isVideoResource(resource) ? "destructive" : "default"}
                  className="capitalize"
                >
                  {getResourceType(resource)}
                </Badge>
              </TableCell>
              <TableCell>{resource.uploadedBy?.fullName || 'Unknown'}</TableCell>
              <TableCell>{new Date(resource.createdAt).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleDownload(resource.resourceId)}
                    disabled={downloadingId === resource.resourceId || isDownloading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {downloadingId === resource.resourceId || isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        View/Download
                      </>
                    )}
                  </Button>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(resource)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous Page"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setCurrentPage(i + 1)}
              aria-label={`Page ${i + 1}`}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next Page"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the resource "{resourceToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ResourceList;
