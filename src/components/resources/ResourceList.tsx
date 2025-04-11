import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getResourcePresignedUrl } from '@/lib/api/resources';

interface ResourceListProps {
  resources: {
    resourceId: number;
    title: string;
    description?: string;
    fileName: string;
    fileUrl: string;
    resourceType: 'assignment' | 'recording';
    createdAt: string;
    uploadedBy: {
      fullName: string;
    };
  }[];
  onDelete: (resourceId: number) => void;
  userRole?: string;
}

export function ResourceList({ resources, onDelete, userRole }: ResourceListProps) {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const canDelete = userRole === 'instructor' || userRole === 'admin';
  const [isDownloading, setIsDownloading] = useState(false);

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
      console.error('Download error:', error);
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

  const handleView = async (resourceId: number) => {
    try {
      setDownloadingId(resourceId);
      const response = await getResourcePresignedUrl(resourceId);
      
      if (response.success && response.data.presignedUrl) {
        window.open(response.data.presignedUrl, '_blank');
      } else {
        throw new Error(response.error || 'Failed to get view URL');
      }
    } catch (error) {
      console.error('View error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to view resource',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => (
            <TableRow key={resource.resourceId}>
              <TableCell className="font-medium">{resource.title}</TableCell>
              <TableCell>
                <Badge variant={resource.resourceType === 'assignment' ? 'default' : 'secondary'}>
                  {resource.resourceType}
                </Badge>
              </TableCell>
              <TableCell>{resource.fileName}</TableCell>
              <TableCell>{resource.uploadedBy.fullName}</TableCell>
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
                      onClick={() => onDelete(resource.resourceId)}
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
    </div>
  );
}
