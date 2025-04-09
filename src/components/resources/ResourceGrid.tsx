
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
  const groupResourcesByType = () => {
    const grouped: Record<string, Resource[]> = {};
    
    resources.forEach(resource => {
      // Make sure resource.type exists before using it
      const resourceType = resource.type || 'unknown';
      
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
