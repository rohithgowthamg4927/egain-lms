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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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
              {filteredResources.map((resource) => (
                <Card key={resource.resourceId} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          isVideoResource(resource) ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
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
                        onClick={() => isVideoResource(resource) ? handleView(resource) : handleDownload(resource)}
                        disabled={downloadingId === resource.resourceId}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {downloadingId === resource.resourceId ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4 mr-2" />
                        )}
                        View/Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
              {filteredResources
                .filter(resource => !isVideoResource(resource))
                .map((resource) => (
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
                          onClick={() => handleDownload(resource)}
                          disabled={downloadingId === resource.resourceId}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {downloadingId === resource.resourceId ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4 mr-2" />
                          )}
                          View/Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              {filteredResources
                .filter(resource => isVideoResource(resource))
                .map((resource) => (
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
                          onClick={() => handleView(resource)}
                          disabled={downloadingId === resource.resourceId}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {downloadingId === resource.resourceId ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4 mr-2" />
                          )}
                          View Recording
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
    </div>
  );
}
