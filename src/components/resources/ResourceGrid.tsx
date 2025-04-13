
import { Resource } from '@/lib/types';
import ResourceCard from './ResourceCard';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface ResourceGridProps {
  resources: Resource[];
  onDelete: (resource: Resource) => void;
  userRole?: string;
}

const ResourceGrid = ({ resources, onDelete, userRole }: ResourceGridProps) => {
  // Helper function to determine resource type
  const getResourceType = (resource: Resource): string => {
    const type = resource.type?.toLowerCase();
    const fileName = resource.fileName?.toLowerCase();
    
    if (!fileName) return type || 'document';
    
    const extension = fileName.split('.').pop();
    
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

  const groupResourcesByType = () => {
    const grouped: Record<string, Resource[]> = {};
    
    resources.forEach(resource => {
      // Use our helper function to determine the resource type
      const resourceType = getResourceType(resource);
      
      if (!grouped[resourceType]) {
        grouped[resourceType] = [];
      }
      grouped[resourceType].push(resource);
    });
    
    return grouped;
  };

  const groupedResources = groupResourcesByType();
  const resourceTypes = Object.keys(groupedResources).sort();
  
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="all">All Resources</TabsTrigger>
        {resourceTypes.map(type => (
          <TabsTrigger key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}s
          </TabsTrigger>
        ))}
      </TabsList>
      
      <TabsContent value="all" className="mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map((resource) => (
            <ResourceCard 
              key={resource.resourceId} 
              resource={resource} 
              onDelete={onDelete}
              userRole={userRole}
            />
          ))}
        </div>
      </TabsContent>
      
      {resourceTypes.map(type => (
        <TabsContent key={type} value={type} className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedResources[type].map((resource) => (
              <ResourceCard 
                key={resource.resourceId} 
                resource={resource} 
                onDelete={onDelete} 
                userRole={userRole}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ResourceGrid;
