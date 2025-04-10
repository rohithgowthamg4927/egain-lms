
import { Resource } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash } from 'lucide-react';
import { getResourcePresignedUrl } from '@/lib/api/resources';
import { useToast } from '@/components/ui/use-toast';

interface ResourceListProps {
  resources: Resource[];
  onDelete?: (resource: Resource) => void;
  userRole?: string;
}

const ResourceList = ({ resources, onDelete, userRole }: ResourceListProps) => {
  const { toast } = useToast();
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

  const handleDownload = async (resource: Resource) => {
    try {
      const response = await getResourcePresignedUrl(resource.resourceId);
      if (response.success && response.data?.presignedUrl) {
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

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Description</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden sm:table-cell">Added On</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[100px]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => (
            <tr key={resource.resourceId} className="border-b hover:bg-muted/50">
              <td className="py-3 px-4">
                <div className="font-medium">
                  <a
                    href={resource.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {formatTitle(resource.title)}
                  </a>
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
  );
};

export default ResourceList;
