
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Resource } from '@/lib/types';
import { getStudentResources } from '@/lib/api/students';
import { format } from 'date-fns';
import { Download, FileText, FileVideo, FileImage, FileAudio, File } from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

export default function StudentResources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [batches, setBatches] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (user?.userId) {
      fetchResources();
    }
  }, [user?.userId]);

  useEffect(() => {
    filterResources();
  }, [selectedBatch, searchQuery, resources]);

  const fetchResources = async () => {
    if (!user?.userId) return;
    
    setIsLoading(true);
    try {
      const resourcesData = await getStudentResources(user.userId);
      
      if (Array.isArray(resourcesData)) {
        setResources(resourcesData);
        
        // Extract unique batches
        const uniqueBatches = Array.from(
          new Set(resourcesData.map(resource => resource.batch?.batchId.toString()))
        ).map(batchId => {
          const batchResource = resourcesData.find(r => r.batch?.batchId.toString() === batchId);
          return {
            id: batchId || '',
            name: batchResource?.batch?.batchName || 'Unknown Batch'
          };
        });
        
        setBatches(uniqueBatches);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch resources',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while fetching resources',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = [...resources];
    
    // Filter by batch
    if (selectedBatch) {
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
        resource.fileName.toLowerCase().includes(query)
      );
    }
    
    setFilteredResources(filtered);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <FileVideo className="h-6 w-6 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage className="h-6 w-6 text-green-500" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return <FileAudio className="h-6 w-6 text-purple-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleDownload = async (resource: Resource) => {
    try {
      const response = await fetch(resource.fileUrl);
      if (!response.ok) throw new Error('Failed to download resource');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to download resource',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Resources', link: '/student/resources' }
      ]} />
      <h1 className="text-3xl font-bold">Resources</h1>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-muted-foreground">
          Access learning materials and resources for your enrolled batches.
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
                <SelectItem value="">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name}
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
                    {getFileIcon(resource.fileName)}
                    <span>{resource.title || resource.fileName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {resource.description && (
                      <p className="text-muted-foreground">{resource.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <p>Batch: {resource.batch?.batchName}</p>
                        <p>Uploaded: {format(new Date(resource.createdAt), 'PPP')}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(resource)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
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
