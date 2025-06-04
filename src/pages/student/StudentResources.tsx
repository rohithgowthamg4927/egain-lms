import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Resource } from '@/lib/types';
import { getResourcesByBatch, getResourcePresignedUrl } from '@/lib/api/resources';
import { apiFetch } from '@/lib/api/core';
import { format } from 'date-fns';
import { Download, FileText, FileVideo, FileImage, FileAudio, File, Eye, Loader2, Star, Lock } from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Batch {
  batchId: number;
  batchName: string;
  course: {
    courseId: number;
    courseName: string;
  };
}

export default function StudentResources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackInterval, setFeedbackInterval] = useState<number | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<{ interval: number, missingInterval: number } | null>(null);
  const [existingFeedback, setExistingFeedback] = useState<{ rating: number, feedback: string } | null>(null);
  const [resourceToUnlock, setResourceToUnlock] = useState<Resource | null>(null);
  const [allFeedbacks, setAllFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    if (user?.userId) {
      fetchBatchesAndResources();
    }
  }, [user?.userId]);

  useEffect(() => {
    filterResources();
  }, [selectedBatch, searchQuery, resources]);

  const fetchBatchesAndResources = async () => {
    if (!user?.userId) return;
    
    setIsLoading(true);
    try {
      // First fetch enrolled batches
      const batchesResponse = await apiFetch<any[]>(`/student-batches/${user.userId}`);
      if (batchesResponse.success && batchesResponse.data) {
        // Transform the student batches data to match our Batch interface
        const transformedBatches = batchesResponse.data.map(sb => ({
          batchId: sb.batch.batchId,
          batchName: sb.batch.batchName,
          course: {
            courseId: sb.batch.course.courseId,
            courseName: sb.batch.course.courseName
          }
        }));
        setBatches(transformedBatches);
        
        // Fetch resources for each batch
        const allResources: Resource[] = [];
        for (const batch of transformedBatches) {
          const resourcesResponse = await getResourcesByBatch(batch.batchId.toString());
          if (resourcesResponse.success && resourcesResponse.data) {
            // Add batch information to each resource
            const resourcesWithBatch = resourcesResponse.data.map(resource => ({
              ...resource,
              batch: {
                batchId: batch.batchId,
                batchName: batch.batchName,
                course: {
                  courseId: batch.course.courseId,
                  courseName: batch.course.courseName
                }
              }
            }));
            allResources.push(...resourcesWithBatch);
          }
        }
        setResources(allResources);
      } else {
        throw new Error('Failed to fetch enrolled batches');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch your enrolled batches and resources',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = [...resources];
    
    // Filter by batch
    if (selectedBatch && selectedBatch !== "all") {
      filtered = filtered.filter(resource => 
        resource.batch?.batchId.toString() === selectedBatch
      );
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.title?.toLowerCase().includes(query) || 
        resource.description?.toLowerCase().includes(query) ||
        resource.batch?.course?.courseName.toLowerCase().includes(query)
      );
    }
    
    setFilteredResources(filtered);
  };

  const getFileIcon = (resource: Resource) => {
    const fileName = resource.fileName || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const resourceType = resource.resourceType || 'document';
    
    if (resourceType === 'recording' || ['mp4', 'mov', 'avi', 'webm'].includes(extension)) {
      return <FileVideo className="h-6 w-6 text-red-500" />;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <FileImage className="h-6 w-6 text-green-500" />;
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return <FileAudio className="h-6 w-6 text-purple-500" />; 
    } else if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(extension)) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleView = async (resource: Resource) => {
    try {
      setDownloadingId(resource.resourceId);
      toast({
        title: 'Loading',
        description: 'Preparing resource...',
      });
      
      const response = await getResourcePresignedUrl(resource.resourceId);
      
      if (response.success && response.data.presignedUrl) {
        window.open(response.data.presignedUrl, '_blank');
      } else {
        throw new Error(response.error || 'Failed to get resource URL');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to view resource',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      setDownloadingId(resource.resourceId);
      toast({
        title: 'Loading',
        description: 'Preparing download...',
      });
      
      const response = await getResourcePresignedUrl(resource.resourceId);
      
      if (response.success && response.data.presignedUrl) {
        window.open(response.data.presignedUrl, '_blank');
        
        toast({
          title: 'Success',
          description: 'Opened resource in new tab',
        });
      } else {
        throw new Error(response.error || 'Failed to get download URL');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open resource',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const getBatchName = (resource: Resource): string => {
    if (resource.batch) {
      return resource.batch.batchName;
    }
    
    if (resource.batchId) {
      const batch = batches.find(b => b.batchId === resource.batchId);
      return batch?.batchName || `Batch ${resource.batchId}`;
    }
    
    return "Unknown Batch";
  };

  const getResourceType = (resource: Resource): string => {
    const fileName = resource.fileName?.toLowerCase() || '';
    const type = resource.type?.toLowerCase() || '';
    
    // Check if it's a video file by extension or type
    if (fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi') || 
        type === 'recording' || type === 'video') {
      return 'Class Recording';
    } else if (fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx') || 
             fileName.endsWith('.ppt') || fileName.endsWith('.pptx') || fileName.endsWith('.txt') || 
             type === 'assignment' || type === 'document') {
      return 'Assignment';
    } else {
      // Default to document for all other types
      return 'Assignment';
    }
  };

  const isVideoResource = (resource: Resource): boolean => {
    const fileName = resource.fileName || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    const resourceType = resource.resourceType || '';
    
    return resourceType === 'recording' || 
           ['mp4', 'mov', 'avi', 'webm'].includes(extension || '');
  };

  // Helper: Get all resources for the selected batch, ordered by createdAt
  const batchResources = selectedBatch && selectedBatch !== 'all'
    ? resources.filter(r => r.batch?.batchId.toString() === selectedBatch)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  // Fetch all feedbacks for the selected batch and user
  const fetchAllFeedbacks = async (batchId: number) => {
    if (!user?.userId) return [];
    const feedbackRes = await apiFetch(`/resources/batches/${batchId}/feedbacks`);
    if (feedbackRes.success && Array.isArray(feedbackRes.data)) {
      setAllFeedbacks(feedbackRes.data.filter(f => f.studentId === user.userId));
      return feedbackRes.data.filter(f => f.studentId === user.userId);
    } else {
      setAllFeedbacks([]);
      return [];
    }
  };

  // Helper: Get the last interval for which feedback has been submitted
  const getLastSubmittedInterval = () => {
    if (!allFeedbacks.length) return 1; // Only interval 1 accessible by default
    return Math.max(...allFeedbacks.map(fb => fb.interval)) + 1; // intervals are 1-based
  };

  // Helper: Get the earliest missing feedback interval up to N-1
  const getEarliestMissingInterval = (targetInterval: number) => {
    for (let i = 1; i < targetInterval; i++) {
      if (!allFeedbacks.some(fb => fb.interval === i)) {
        return i;
      }
    }
    return null;
  };

  // Handler for locked resource click
  const handleLockedResourceClick = async (resource: Resource, interval: number, batchId: number) => {
    setResourceToUnlock(resource);
    setFeedbackInterval(null);
    setShowFeedbackModal(false);
    // Fetch all feedbacks for this batch and user
    const feedbacks = await fetchAllFeedbacks(batchId);
    const earliestMissing = getEarliestMissingInterval(interval);
    if (earliestMissing !== null) {
      // Prompt for the earliest missing feedback
      setFeedbackInterval(earliestMissing);
      const fb = feedbacks.find(f => f.interval === earliestMissing);
      if (fb) setExistingFeedback({ rating: fb.rating, feedback: fb.feedback });
      else setExistingFeedback(null);
      setShowFeedbackModal(true);
    }
  };

  // Handler for feedback submit
  const handleSubmitFeedback = async () => {
    if (!user?.userId || !selectedBatch || feedbackInterval === null || feedbackRating === 0 || !feedbackText) return;
    setFeedbackLoading(true);
    try {
      const res = await apiFetch(`/resources/batches/${selectedBatch}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: user.userId,
          interval: feedbackInterval,
          rating: feedbackRating,
          feedback: feedbackText
        })
      });
      if (res.success) {
        toast({ title: 'Feedback submitted', description: 'Thank you for your feedback!' });
        // Refetch all feedbacks
        const feedbacks = await fetchAllFeedbacks(Number(selectedBatch));
        // Check if there is another missing interval up to the interval of the resource to unlock
        if (resourceToUnlock) {
          const idx = batchResources.findIndex(r => r.resourceId === resourceToUnlock.resourceId);
          const interval = Math.floor(idx / 5) + 1;
          const nextMissing = getEarliestMissingInterval(interval);
          if (nextMissing !== null) {
            setFeedbackInterval(nextMissing);
            const fb = feedbacks.find(f => f.interval === nextMissing);
            if (fb) setExistingFeedback({ rating: fb.rating, feedback: fb.feedback });
            else setExistingFeedback(null);
            setShowFeedbackModal(true);
            return;
          }
        }
        setShowFeedbackModal(false);
        setPendingFeedback(null);
        setExistingFeedback(null);
        setFeedbackRating(0);
        setFeedbackText('');
        setResourceToUnlock(null);
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to submit feedback', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to submit feedback', variant: 'destructive' });
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Helper: Determine if a resource is locked for the student
  const isResourceLocked = (resource: Resource, idx: number, batchId: number) => {
    if (!user || user.role !== 'student') return false;
    const interval = Math.floor(idx / 5) + 1;
    // Only allow up to the last submitted interval
    const lastSubmitted = getLastSubmittedInterval();
    return interval > lastSubmitted;
  };

  // On batch change, fetch all feedbacks
  useEffect(() => {
    if (selectedBatch && selectedBatch !== 'all') {
      fetchAllFeedbacks(Number(selectedBatch));
    } else {
      setAllFeedbacks([]);
    }
    // eslint-disable-next-line
  }, [selectedBatch, user?.userId]);

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Resources', link: '/student/resources' }
      ]} />
      <h1 className="text-3xl font-bold">Resources</h1>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-muted-foreground">
          Access assignments, documents, and class recordings for your enrolled batches.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {batches.map((batch) => (
              <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                {batch.batchName} {batch.course ? `- ${batch.course.courseName}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-[300px]"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="recordings">Class Recordings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batchResources.map((resource, idx) => {
                const interval = Math.floor(idx / 5) + 1;
                const locked = isResourceLocked(resource, idx, resource.batch.batchId);
                return (
                <Card key={resource.resourceId} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${isVideoResource(resource) ? 'bg-red-100' : 'bg-blue-100'}`}>
                          {getFileIcon(resource)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {resource.title || resource.fileName || `Resource ${resource.resourceId}`}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {resource.batch?.course?.courseName} - {resource.batch?.batchName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={isVideoResource(resource) ? 'destructive' : 'default'} className="text-[10px]">
                              {isVideoResource(resource) ? 'Recording' : 'Assignment'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(resource.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 border-t flex justify-end">
                      <Button
                        size="sm"
                          onClick={() => locked ? handleLockedResourceClick(resource, interval, resource.batch.batchId) : (isVideoResource(resource) ? handleView(resource) : handleDownload(resource))}
                        disabled={downloadingId === resource.resourceId}
                          className={`bg-blue-600 hover:bg-blue-700 text-white ${locked ? 'opacity-60 cursor-pointer' : ''}`}
                      >
                          {locked ? (
                            <Lock className="h-4 w-4 mr-2" />
                          ) : downloadingId === resource.resourceId ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                          {locked ? 'Locked' : 'View/Download'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batchResources
                .map((resource, idx) => ({ resource, idx }))
                .filter(({ resource }) => !isVideoResource(resource))
                .map(({ resource, idx }) => {
                  const interval = Math.floor(idx / 5) + 1;
                  const locked = isResourceLocked(resource, idx, resource.batch.batchId);
                  return (
                    <Card key={resource.resourceId} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              {getFileIcon(resource)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {resource.title || resource.fileName || `Resource ${resource.resourceId}`}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {resource.batch?.course?.courseName} - {resource.batch?.batchName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="default" className="text-[10px]">Assignment</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(resource.createdAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-2 border-t flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => locked ? handleLockedResourceClick(resource, interval, resource.batch.batchId) : handleDownload(resource)}
                            disabled={downloadingId === resource.resourceId}
                            className={`bg-blue-600 hover:bg-blue-700 text-white ${locked ? 'opacity-60 cursor-pointer' : ''}`}
                          >
                            {locked ? (
                              <Lock className="h-4 w-4 mr-2" />
                            ) : downloadingId === resource.resourceId ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4 mr-2" />
                            )}
                            {locked ? 'Locked' : 'View/Download'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recordings" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batchResources
                .map((resource, idx) => ({ resource, idx }))
                .filter(({ resource }) => isVideoResource(resource))
                .map(({ resource, idx }) => {
                  const interval = Math.floor(idx / 5) + 1;
                  const locked = isResourceLocked(resource, idx, resource.batch.batchId);
                  return (
                    <Card key={resource.resourceId} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="bg-red-100 p-2 rounded-full">
                              <FileVideo className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {resource.title || resource.fileName || `Resource ${resource.resourceId}`}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {resource.batch?.course?.courseName} - {resource.batch?.batchName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="destructive" className="text-[10px]">Recording</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(resource.createdAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-2 border-t flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => locked ? handleLockedResourceClick(resource, interval, resource.batch.batchId) : handleView(resource)}
                            disabled={downloadingId === resource.resourceId}
                            className={`bg-blue-600 hover:bg-blue-700 text-white ${locked ? 'opacity-60 cursor-pointer' : ''}`}
                          >
                            {locked ? (
                              <Lock className="h-4 w-4 mr-2" />
                            ) : downloadingId === resource.resourceId ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4 mr-2" />
                            )}
                            {locked ? 'Locked' : 'View Recording'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {!isLoading && filteredResources.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <h3 className="text-lg font-medium">No resources found</h3>
          <p className="text-muted-foreground mt-1">
            {resources.length === 0 
              ? 'No resources are available for your enrolled batches' 
              : 'Try adjusting your filters'}
          </p>
        </div>
      )}

      {/* Feedback Modal */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Feedback to Unlock Resources</DialogTitle>
            <DialogDescription>
              Please rate and review your batch to access the next set of resources.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Rating</h4>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${star <= (feedbackRating || existingFeedback?.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    onClick={() => setFeedbackRating(star)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="feedback" className="text-sm font-medium">
                Feedback (required)
              </label>
              <Textarea
                id="feedback"
                placeholder="Write your feedback here..."
                value={feedbackText || existingFeedback?.feedback || ''}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback} disabled={feedbackLoading || feedbackRating === 0 || !feedbackText}>
              {feedbackLoading ? 'Submitting...' : (existingFeedback ? 'Update Feedback' : 'Submit Feedback')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
