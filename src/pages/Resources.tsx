import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Resource, Course } from '@/lib/types';
import { Plus, Search, File, Link, Book } from 'lucide-react';
import { getResources, getCourses, createResource } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form states for creating a new resource
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceType, setNewResourceType] = useState('document');
  const [newResourceCourseId, setNewResourceCourseId] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceDescription, setNewResourceDescription] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const [resourcesResponse, coursesResponse] = await Promise.all([
          getResources(),
          getCourses(),
        ]);
        
        if (resourcesResponse.success && resourcesResponse.data) {
          setResources(resourcesResponse.data);
        } else {
          toast({
            title: 'Error',
            description: resourcesResponse.error || 'Failed to fetch resources',
            variant: 'destructive',
          });
        }
        
        if (coursesResponse.success && coursesResponse.data) {
          setCourses(coursesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while fetching resources',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const filteredResources = resources.filter((resource) =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddResource = async () => {
    if (!newResourceTitle || !newResourceType || !newResourceCourseId || !newResourceUrl) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const resourceData = {
        title: newResourceTitle,
        type: newResourceType,
        courseId: parseInt(newResourceCourseId),
        url: newResourceUrl,
        description: newResourceDescription,
      };

      const response = await createResource(resourceData);
      
      if (response.success) {
        toast({
          title: 'Resource created',
          description: `Resource "${newResourceTitle}" has been created successfully.`,
        });
        
        // Reset form fields
        setNewResourceTitle('');
        setNewResourceType('document');
        setNewResourceCourseId('');
        setNewResourceUrl('');
        setNewResourceDescription('');
        
        setIsCreateDialogOpen(false);
        
        // Refetch resources
        const resourcesResponse = await getResources();
        if (resourcesResponse.success && resourcesResponse.data) {
          setResources(resourcesResponse.data);
        }
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create resource',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  // Fixed by ensuring accessorKey matches exact keys in Resource type
  const resourceColumns = [
    {
      accessorKey: 'title' as keyof Resource,
      header: 'Resource Title',
      cell: ({ row }: { row: { original: Resource } }) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
            {row.original.type === 'document' ? (
              <File className="h-5 w-5 text-primary" />
            ) : (
              <Book className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type' as keyof Resource,
      header: 'Type',
      cell: ({ row }: { row: { original: Resource } }) => (
        <span className="capitalize">{row.original.type}</span>
      ),
    },
    {
      accessorKey: 'courseId' as keyof Resource,
      header: 'Course',
      cell: ({ row }: { row: { original: Resource } }) => {
        const course = courses.find(c => c.courseId === row.original.courseId);
        return course ? course.courseName : 'Unknown Course';
      },
    },
    {
      accessorKey: 'url' as keyof Resource,
      header: 'Resource Link',
      cell: ({ row }: { row: { original: Resource } }) => (
        <a 
          href={row.original.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:underline"
        >
          <Link className="h-4 w-4 mr-1" />
          View Resource
        </a>
      ),
    },
  ];

  const resourceActions = [
    {
      label: 'Edit',
      onClick: (resource: Resource) => {
        toast({
          title: 'Edit Resource',
          description: `Edit feature for resource "${resource.title}" coming soon`,
        });
      },
      icon: <File className="h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: (resource: Resource) => {
        toast({
          title: 'Delete Resource',
          description: `Are you sure you want to delete "${resource.title}"?`,
          variant: 'destructive',
        });
      },
      icon: <File className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Resources</h1>
          <p className="text-muted-foreground">
            Share materials, links, and documents with your students.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Learning Resource</DialogTitle>
              <DialogDescription>
                Share materials, links, and documents with your students.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="resourceTitle">Resource Title</Label>
                <Input
                  id="resourceTitle"
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                  placeholder="Enter resource title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resourceType">Resource Type</Label>
                <Select value={newResourceType} onValueChange={setNewResourceType}>
                  <SelectTrigger id="resourceType">
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="code">Code</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resourceCourse">Course</Label>
                <Select value={newResourceCourseId} onValueChange={setNewResourceCourseId}>
                  <SelectTrigger id="resourceCourse">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.courseId} value={course.courseId.toString()}>
                        {course.courseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resourceUrl">Resource URL</Label>
                <Input
                  id="resourceUrl"
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                  placeholder="Enter resource URL"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resourceDescription">Description (Optional)</Label>
                <Textarea
                  id="resourceDescription"
                  value={newResourceDescription}
                  onChange={(e) => setNewResourceDescription(e.target.value)}
                  placeholder="Enter resource description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddResource}>Add Resource</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{resources.length}</span>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <File className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Document Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {resources.filter(r => r.type === 'document').length}
              </span>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <File className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="neo-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Code Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {resources.filter(r => r.type === 'code').length}
              </span>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Book className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-lg border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading resources...</p>
          </div>
        ) : (
          <DataTable
            data={filteredResources}
            columns={resourceColumns}
            actions={resourceActions}
            className="w-full"
            searchKey="title"
          />
        )}
      </div>
    </div>
  );
};

export default Resources;
