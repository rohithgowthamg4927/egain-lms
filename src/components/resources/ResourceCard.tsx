import { useState } from 'react';
import { Resource } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, MoreVertical, Trash, Calendar, Eye, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { getResourcePresignedUrl } from '@/lib/api/resources';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ResourceCardProps {
  resource: Resource;
  onDelete?: (resource: Resource) => void;
  userRole?: string;
}

const ResourceCard = ({
  resource,
  onDelete,
  userRole
}: ResourceCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Safely access resource properties with default fallbacks
  const resourceTitle = resource?.title || 'Untitled Resource';
  const resourceDescription = resource?.description || 'No description available for this resource.';
  const resourceCreatedAt = resource?.createdAt || new Date().toISOString();
  const fileName = resource?.fileName || '';

  // Determine resource type based on file extension and resource.type
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

  const resourceType = getResourceType(resource?.type, fileName);

  const resourceTypeColors = {
    'document': 'bg-blue-100 hover:bg-blue-200 text-blue-800',
    'video': 'bg-red-100 hover:bg-red-200 text-red-800',
    'assignment': 'bg-amber-100 hover:bg-amber-200 text-amber-800',
    'link': 'bg-green-100 hover:bg-green-200 text-green-800',
    'code': 'bg-purple-100 hover:bg-purple-200 text-purple-800',
  };

  const getResourceTypeColor = (type: string) => {
    return resourceTypeColors[type as keyof typeof resourceTypeColors] || 'bg-gray-100 hover:bg-gray-200 text-gray-800';
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <div className="bg-blue-100 p-3 rounded-full"><svg className="h-6 w-6 text-blue-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg></div>;
      case 'video':
        return <div className="bg-red-100 p-3 rounded-full"><svg className="h-6 w-6 text-red-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9l6 3l-6 3V9z" /><rect width="20" height="14" x="2" y="5" rx="2" ry="2" /></svg></div>;
      case 'assignment':
        return <div className="bg-amber-100 p-3 rounded-full"><svg className="h-6 w-6 text-amber-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg></div>;
      case 'link':
        return <div className="bg-green-100 p-3 rounded-full"><svg className="h-6 w-6 text-green-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg></div>;
      case 'code':
        return <div className="bg-purple-100 p-3 rounded-full"><svg className="h-6 w-6 text-purple-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg></div>;
      default:
        return <div className="bg-gray-100 p-3 rounded-full"><svg className="h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /></svg></div>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await getResourcePresignedUrl(resource.resourceId);

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
      setIsDownloading(false);
    }
  };

  const handleView = async () => {
    try {
      setIsDownloading(true);
      const response = await getResourcePresignedUrl(resource.resourceId);

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
      setIsDownloading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (onDelete) {
      try {
        await Promise.resolve(onDelete(resource));
        setShowDeleteDialog(false);
      } catch (error) {
        console.error('Delete error:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete resource',
          variant: 'destructive',
        });
      }
    }
  };

  const canDelete = userRole === 'instructor' || userRole === 'admin';

  return (
    <Card
      className={`overflow-hidden transition-all duration-300 h-full flex flex-col relative ${
        isHovered ? 'shadow-lg translate-y-[-4px]' : 'shadow'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 flex items-center justify-between">
        {getResourceIcon(resourceType)}
        <Badge variant="outline" className={`font-normal ${getResourceTypeColor(resourceType)}`}>
          {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
        </Badge>
      </div>

      <CardHeader className="pt-0 pb-1 px-4">
        <CardTitle className="text-sm font-semibold line-clamp-1">{resourceTitle}</CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-2">
        <p className="text-muted-foreground text-xs mb-2 line-clamp-3">{resourceDescription}</p>
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          <span>Added on {formatDate(resourceCreatedAt)}</span>
        </div>
      </CardContent>

      <CardFooter className="px-4 pt-3 pb-4 flex items-center">
        <div className="flex-1" />
        <Button
          variant="default"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-300 h-8 px-4 text-xs"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              View/Download Resource
            </>
          )}
        </Button>
        <div className="flex-1 flex justify-end">
          {canDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted transition-colors duration-300 ml-2"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="animate-in fade-in zoom-in-75 duration-200">
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-500 hover:text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardFooter>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the resource "{resourceTitle}". This action cannot be undone.
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
    </Card>
  );
};

export default ResourceCard;
