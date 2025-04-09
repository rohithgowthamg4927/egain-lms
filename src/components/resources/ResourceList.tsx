
import { Resource } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash } from 'lucide-react';

interface ResourceListProps {
  resources: Resource[];
  onDelete: (resource: Resource) => void;
  userRole?: string;
}

const ResourceList = ({ resources, onDelete, userRole }: ResourceListProps) => {
  const getResourceTypeColor = (type: string | undefined) => {
    // Use a default type if none provided
    const resourceType = type || 'document';
    
    const resourceTypeColors = {
      'document': 'bg-blue-100 hover:bg-blue-200 text-blue-800',
      'video': 'bg-red-100 hover:bg-red-200 text-red-800',
      'assignment': 'bg-amber-100 hover:bg-amber-200 text-amber-800',
      'link': 'bg-green-100 hover:bg-green-200 text-green-800',
      'code': 'bg-purple-100 hover:bg-purple-200 text-purple-800',
    };

    return resourceTypeColors[resourceType as keyof typeof resourceTypeColors] || 'bg-gray-100 hover:bg-gray-200 text-gray-800';
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
                  className={getResourceTypeColor(resource.type)}
                >
                  {(resource.type || 'Document').charAt(0).toUpperCase() + (resource.type || 'document').slice(1)}
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
                    onClick={() => window.open(resource.url || '#', '_blank')}
                    title="Download Resource"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {userRole === 'instructor' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(resource)}
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
