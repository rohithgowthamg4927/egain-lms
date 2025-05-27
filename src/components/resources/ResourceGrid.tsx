import { Resource } from '@/lib/types';
import ResourceCard from './ResourceCard';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface ResourceGridProps {
  resources: Resource[];
  onDelete: (resource: Resource) => void;
  userRole?: string;
  selectedResourceIds?: number[];
  onSelectResource?: (resourceId: number, checked: boolean) => void;
  onViewFeedback?: (batchId: number, interval: number) => void;
}

const ResourceGrid = ({ resources, onDelete, userRole, selectedResourceIds, onSelectResource, onViewFeedback }: ResourceGridProps) => {
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
  
  // Helper to group resources into intervals of 5
  const groupByInterval = (resources: Resource[]) => {
    const groups: Resource[][] = [];
    for (let i = 0; i < resources.length; i += 5) {
      groups.push(resources.slice(i, i + 5));
    }
    return groups;
  };

  const grouped = groupByInterval(resources);
  
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
        <div className="space-y-8">
          {grouped.map((group, idx) => (
            <div key={idx} className="flex items-end gap-4">
              {group.map((resource) => (
            <ResourceCard 
              key={resource.resourceId} 
              resource={resource} 
              onDelete={onDelete}
              userRole={userRole}
                  checked={selectedResourceIds?.includes(resource.resourceId) || false}
                  onCheck={onSelectResource}
                />
              ))}
              {(userRole === 'admin' || userRole === 'instructor') && group.length === 5 && (
                <Button
                  variant="outline"
                  className="ml-2 h-12"
                  onClick={() => {
                    if (onViewFeedback) {
                      console.log('View Feedback button clicked for batch', group[0].batchId || group[0].batch?.batchId, 'interval', idx + 1);
                      onViewFeedback(group[0].batchId || group[0].batch?.batchId, idx + 1);
                    } else {
                      console.warn('onViewFeedback not provided');
                    }
                  }}
                >
                  View Feedback
                </Button>
              )}
            </div>
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
                checked={selectedResourceIds?.includes(resource.resourceId) || false}
                onCheck={onSelectResource}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ResourceGrid;
