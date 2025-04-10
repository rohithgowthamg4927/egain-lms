import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Search, LayoutGrid, List } from 'lucide-react';
import { UploadResourceDialog } from '@/components/resources/UploadResourceDialog';
import ResourceMetrics from '@/components/resources/ResourceMetrics';
import ResourceGrid from '@/components/resources/ResourceGrid';
import ResourceList from '@/components/resources/ResourceList';
import { Batch, Resource } from '@/lib/types';
import { getBatches, getResourcesByBatch, deleteResource } from '@/lib/api';

export default function ResourcesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchResources(selectedBatch);
    } else {
      setResources([]);
      setIsLoading(false);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const response = await getBatches();
      if (response.success && response.data) {
        setBatches(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch batches',
        variant: 'destructive',
      });
    }
  };

  const fetchResources = async (batchId: string) => {
    setIsLoading(true);
    try {
      const response = await getResourcesByBatch(batchId);
      if (response.success && response.data) {
        setResources(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch resources');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resources',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await deleteResource(resource.resourceId);

      if (!response.success) throw new Error(response.error || 'Failed to delete resource');

      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
      });

      // Refresh resources list
      if (selectedBatch) {
        fetchResources(selectedBatch);
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resource',
        variant: 'destructive',
      });
    }
  };

  const filteredResources = resources.filter(resource =>
    resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if user is an instructor or admin
  const canManageResources = user?.role === 'instructor' || user?.role === 'admin';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Resources</h1>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-muted-foreground">
          Access and manage educational assignments, class recordings for your batches.
        </p>
        {canManageResources && (
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
        )}
      </div>

      {selectedBatch && resources.length > 0 && (
        <ResourceMetrics resources={filteredResources} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={selectedBatch}
              onValueChange={setSelectedBatch}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                    {batch.batchName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>
        
        <div className="col-span-1 flex justify-end">
          <div className="border rounded-md flex">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
              title="List view"
            >
              <List className="h-4 w-4" />
              <span className="sr-only">List view</span>
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : selectedBatch === '' ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <h3 className="text-lg font-medium">No batch selected</h3>
          <p className="text-muted-foreground mt-1">Please select a batch to view resources</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <h3 className="text-lg font-medium">No resources found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery ? 'Try a different search term' : 'This batch has no resources yet'}
          </p>
          {canManageResources && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add your first resource
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <ResourceGrid 
          resources={filteredResources} 
          onDelete={handleDelete} 
          userRole={user?.role} 
        />
      ) : (
        <ResourceList 
          resources={filteredResources} 
          onDelete={handleDelete} 
          userRole={user?.role}
        />
      )}

      <UploadResourceDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onSuccess={() => {
          if (selectedBatch) {
            fetchResources(selectedBatch);
          }
        }}
        batches={batches}
      />
    </div>
  );
}
