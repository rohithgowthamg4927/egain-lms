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
import { Download, FileText, FileVideo, FileImage, FileAudio, File, Eye, Loader2 } from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

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
      console.error('Error fetching data:', error);
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
      console.error('Error viewing resource:', error);
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
      console.error('Download error:', error);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2">
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
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredResources.length > 0 ? (
            filteredResources.map((resource) => (
              <Card key={resource.resourceId}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getFileIcon(resource)}
                    <span>{resource.title || resource.fileName || `Resource ${resource.resourceId}`}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {resource.description && (
                      <p className="text-muted-foreground">{resource.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>Batch: {getBatchName(resource)}</p>
                        <p>Type: {getResourceType(resource)}</p>
                        <p>Uploaded: {format(new Date(resource.createdAt), 'PPP')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => isVideoResource(resource) ? handleView(resource) : handleDownload(resource)}
                          disabled={downloadingId === resource.resourceId}
                          className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
                        >
                          {downloadingId === resource.resourceId ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4 mr-2" />
                          )}
                          {/* {isVideoResource(resource) ? 'View' : 'Download'} */}
                          View/Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <h3 className="text-lg font-medium">No resources found</h3>
              <p className="text-muted-foreground mt-1">
                {resources.length === 0 
                  ? 'No resources are available for your enrolled batches' 
                  : 'Try adjusting your filters'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
