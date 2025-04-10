import { useState } from 'react';
import { Resource } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, MoreVertical, Trash, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { getResourcePresignedUrl } from '@/lib/api/resources';
import { useToast } from '@/components/ui/use-toast';

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

  // Safely access resource properties with default fallbacks
  const resourceType = resource?.type || 'document';
  const resourceTitle = resource?.title || 'Untitled Resource';
  const resourceDescription = resource?.description || 'No description available for this resource.';
  const resourceCreatedAt = resource?.createdAt || new Date().toISOString();

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
        return <div className="bg-blue-100 p-3 rounded-full"><svg className="h-6 w-6 text-blue-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>;
      case 'video':
        return <div className="bg-red-100 p-3 rounded-full"><svg className="h-6 w-6 text-red-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9l6 3l-6 3V9z"/><rect width="20" height="14" x="2" y="5" rx="2" ry="2"/></svg></div>;
      case 'assignment':
        return <div className="bg-amber-100 p-3 rounded-full"><svg className="h-6 w-6 text-amber-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>;
      case 'link':
        return <div className="bg-green-100 p-3 rounded-full"><svg className="h-6 w-6 text-green-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>;
      case 'code':
        return <div className="bg-purple-100 p-3 rounded-full"><svg className="h-6 w-6 text-purple-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>;
      default:
        return <div className="bg-gray-100 p-3 rounded-full"><svg className="h-6 w-6 text-gray-700" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/></svg></div>;
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

  const handleDelete = () => {
    if (onDelete) {
      onDelete(resource);
    }
  };

  const canDelete = userRole === 'instructor' || userRole === 'admin';

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 h-full flex flex-col ${
        isHovered ? 'shadow-lg translate-y-[-4px]' : 'shadow'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6 flex items-center justify-between">
        {getResourceIcon(resourceType)}
        <Badge variant="outline" className={`font-normal ${getResourceTypeColor(resourceType)}`}>
          {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}
        </Badge>
      </div>

      <CardHeader className="pb-2 pt-0">
        <CardTitle className="line-clamp-1 text-lg">{resourceTitle}</CardTitle>
      </CardHeader>

      <CardContent className="pb-4 flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {resourceDescription}
        </p>

        <div className="grid grid-cols-1 gap-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Added on {formatDate(resourceCreatedAt)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex flex-col gap-2">
        <Button
          variant="default"
          className="w-full gap-2 group"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          View/Download Resource
        </Button>
        
        {canDelete && (
          <div className="flex justify-end w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ResourceCard;
