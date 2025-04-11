import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Batch, Resource } from '@/lib/types';
import { getBatches } from '@/lib/api';
import { getResourcesByBatch } from '@/lib/api/resources';
import { format } from 'date-fns';
import { Download, FileText, FileVideo, FileImage, FileAudio, File } from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

export default function StudentResources() {
  const { user } = useAuth();
  const { toast } = useToast();
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

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
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
      const response = await fetch(resource.presignedUrl);
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

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full sm:w-[200px] p-2 border rounded-md"
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.batchId} value={batch.batchId.toString()}>
                  {batch.batchName}
                </option>
              ))}
            </select>
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
                    {getFileIcon(resource.fileType)}
                    <span>{resource.fileName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {resource.description && (
                      <p className="text-muted-foreground">{resource.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Uploaded on {format(new Date(resource.createdAt), 'PPP')}
                      </span>
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
                {selectedBatch ? 'No resources available for this batch' : 'Please select a batch to view resources'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 