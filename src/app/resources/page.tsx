import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api/core';
import { Loader2, Plus, Search, LayoutGrid, List } from 'lucide-react';
import { UploadResourceDialog } from '@/components/resources/UploadResourceDialog';
import ResourceMetrics from '@/components/resources/ResourceMetrics';
import ResourceGrid from '@/components/resources/ResourceGrid';
import ResourceList from '@/components/resources/ResourceList';
import { Batch, Resource } from '@/lib/types';
import { getBatches } from '@/lib/api/batches';
import { getResourcesByBatch, deleteResource } from '@/lib/api/resources';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input as AppInput } from '@/components/ui/input';
import { Select as AppSelect } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

export default function ResourcesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);
  const [dateSort, setDateSort] = useState<'latest' | 'earliest'>('latest');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackInterval, setFeedbackInterval] = useState<number | null>(null);
  const [feedbackBatchId, setFeedbackBatchId] = useState<number | null>(null);
  const [studentFilter, setStudentFilter] = useState<'all' | number>('all');
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';

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
        // Filter batches based on user role
        const filtered = response.data.filter((batch: Batch) => {
          if (isAdmin) return true;
          if (isInstructor && user?.userId) {
            return batch.instructor?.userId === user.userId;
          }
          return false;
        });
        setBatches(filtered);
        setFilteredBatches(filtered);
      } else {
        throw new Error(response.error || 'Failed to fetch batches');
      }
    } catch (error) {
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
        const compatibleResources: Resource[] = response.data.map(resource => ({
          ...resource,
          resourceId: resource.resourceId,
          title: resource.title || 'Untitled Resource',
          fileName: resource.fileName || 'unknown.file',
          fileUrl: resource.fileUrl || '',
          resourceType: resource.resourceType || 'assignment',
          createdAt: resource.createdAt,
          updatedAt: resource.updatedAt || resource.createdAt,
          uploadedBy: resource.uploadedBy || { fullName: 'System' }
        }));
        setResources(compatibleResources);
      } else {
        throw new Error(response.error || 'Failed to fetch resources');
      }
    } catch (error) {
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
    try {
      const response = await deleteResource(resourceId);

      if (!response.success) throw new Error(response.error || 'Failed to delete resource');

      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
      });

      if (selectedBatch) {
        fetchResources(selectedBatch);
      }
    } catch (error) {
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

  const canManageResources = isAdmin || (isInstructor && filteredBatches.length > 0);

  const handleResourceDelete = (resource: Resource) => {
    if (resource.resourceId) {
      handleDelete(resource.resourceId);
    }
  };

  const handleSelectResource = (resourceId: number, checked: boolean) => {
    setSelectedResourceIds((prev) =>
      checked ? [...prev, resourceId] : prev.filter((id) => id !== resourceId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedResourceIds(filteredResources.map((r) => r.resourceId));
    } else {
      setSelectedResourceIds([]);
    }
  };

  const handleBulkDelete = async () => {
    setShowBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    try {
      // Call the new bulk delete API endpoint
      const response = await apiFetch('/resources/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ resourceIds: selectedResourceIds }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.success) throw new Error(response.error || 'Failed to delete resources');
      toast({
        title: 'Success',
        description: 'Resources deleted successfully',
      });
      setSelectedResourceIds([]);
      if (selectedBatch) fetchResources(selectedBatch);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete resources',
        variant: 'destructive',
      });
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const sortedResources = [...filteredResources].sort((a, b) => {
    if (dateSort === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
  });

  const handleViewFeedback = async (batchId: number, interval: number) => {
    setShowFeedbackModal(true);
    setFeedbackLoading(true);
    setFeedbackInterval(interval);
    setFeedbackBatchId(batchId);
    setFeedbackFilter('all');
    setFeedbackSearch('');
    try {
      const res = await apiFetch(`/resources/batches/${batchId}/feedbacks`);
      if (res.success && Array.isArray(res.data)) {
        const filtered = res.data.filter(fb => fb.interval === interval);
        setFeedbacks(filtered);
      } else {
        setFeedbacks([]);
      }
    } catch (e) {
      setFeedbacks([]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Resources', link: '/resources' }
      ]} />
      <h1 className="text-3xl font-bold">Resources</h1>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-muted-foreground">
          {isAdmin 
            ? "Access and manage educational assignments, class recordings for all batches."
            : "Access and manage educational assignments, class recordings for your assigned batches."}
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
                {filteredBatches.map((batch) => (
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

      <div className="flex flex-col sm:flex-row gap-0.5 items-center mb-2">
        <Checkbox
          checked={selectedResourceIds.length === filteredResources.length && filteredResources.length > 0}
          onCheckedChange={handleSelectAll}
          className="mr-2"
        />
        <span>Select All</span>
        <Select value={dateSort} onValueChange={v => setDateSort(v as 'latest' | 'earliest')}>
          <SelectTrigger className="w-[180px] ml-4">
            <SelectValue placeholder="Sort by Date Added" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest First</SelectItem>
            <SelectItem value="earliest">Earliest First</SelectItem>
          </SelectContent>
        </Select>
        {selectedResourceIds.length > 0 && (
          <Button variant="destructive" className="ml-4" onClick={handleBulkDelete}>
            Delete Selected ({selectedResourceIds.length})
          </Button>
        )}
      </div>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Resources</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedResourceIds.length} selected resource{selectedResourceIds.length > 1 ? 's' : ''}? This action cannot be undone and will remove all associated feedback for affected intervals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          resources={sortedResources} 
          onDelete={handleResourceDelete} 
          userRole={user?.role} 
          selectedResourceIds={selectedResourceIds}
          onSelectResource={handleSelectResource}
          onViewFeedback={handleViewFeedback}
        />
      ) : (
        <ResourceList 
          resources={sortedResources} 
          onDelete={handleResourceDelete} 
          userRole={user?.role}
          selectedResourceIds={selectedResourceIds}
          onSelectResource={handleSelectResource}
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
        batches={filteredBatches}
      />

      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Feedback for Interval {feedbackInterval}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {feedbackBatchId && feedbackInterval && (
                <>Batch ID: {feedbackBatchId} | Interval: {feedbackInterval}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <AppSelect value={feedbackFilter.toString()} onValueChange={v => setFeedbackFilter(v === 'all' ? 'all' : (Number(v) as 1|2|3|4|5))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {[5,4,3,2,1].map(r => <SelectItem key={r} value={r.toString()}>{r} Stars</SelectItem>)}
              </SelectContent>
            </AppSelect>
            <AppSelect value={studentFilter.toString()} onValueChange={v => setStudentFilter(v === 'all' ? 'all' : Number(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {Array.from(new Set(feedbacks.map(fb => fb.student?.userId)))
                  .filter(id => id)
                  .map(id => {
                    const student = feedbacks.find(fb => fb.student?.userId === id)?.student;
                    return student ? (
                      <SelectItem key={id} value={id.toString()}>{student.fullName}</SelectItem>
                    ) : null;
                  })}
              </SelectContent>
            </AppSelect>
            <AppInput
              className="w-full sm:w-[220px]"
              placeholder="Search by student name..."
              value={feedbackSearch}
              onChange={e => setFeedbackSearch(e.target.value)}
            />
          </div>
          {feedbackLoading ? (
            <div className="py-8 text-center text-base">Loading...</div>
          ) : feedbacks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-base">No feedback found for this interval.</div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {feedbacks
                .filter(fb => feedbackFilter === 'all' || fb.rating === feedbackFilter)
                .filter(fb => studentFilter === 'all' || (fb.student && fb.student.userId === studentFilter))
                .filter(fb => !feedbackSearch || (fb.student && fb.student.fullName && fb.student.fullName.toLowerCase().includes(feedbackSearch.toLowerCase())))
                .map(fb => (
                  <div key={fb.feedbackId} className="border rounded p-3 bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{fb.student?.fullName || 'Unknown Student'}</span>
                      <span className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className={`h-4 w-4 ${star <= fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">{new Date(fb.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-base">{fb.feedback}</div>
                  </div>
                ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
