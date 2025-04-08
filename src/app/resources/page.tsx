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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Loader2, MoreVertical, Plus, Search } from 'lucide-react';
import { UploadResourceDialog } from '@/components/resources/UploadResourceDialog';
import { Batch, Resource } from '@/lib/types';
import { getBatches, getResourcesByBatch } from '@/lib/api';

export default function ResourcesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchResources(selectedBatch);
    } else {
      setResources([]);
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

  const handleDelete = async (resourceId: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete resource');

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
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Resources</h1>
        <Button onClick={() => setIsUploadDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Resource
        </Button>
      </div>

      <div className="flex gap-4">
        <Select
          value={selectedBatch}
          onValueChange={setSelectedBatch}
        >
          <SelectTrigger className="w-[200px]">
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No resources found
                </TableCell>
              </TableRow>
            ) : (
              filteredResources.map((resource) => (
                <TableRow key={resource.resourceId}>
                  <TableCell className="font-medium">
                    <a
                      href={resource.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {resource.title}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={resource.resourceType === 'assignment' ? 'default' : 'secondary'}>
                      {resource.resourceType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {resource.description}
                  </TableCell>
                  <TableCell>{resource.uploadedBy.name}</TableCell>
                  <TableCell>{formatDate(resource.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(resource.fileUrl, '_blank')}
                        >
                          Download
                        </DropdownMenuItem>
                        {user?.role === 'instructor' && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(resource.resourceId)}
                          >
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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