
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { DataTable } from '@/components/ui/data-table';
import { Resource } from '@/lib/types';
import { Plus, Search, File, Link, Book } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Resources = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // For now, we'll use mock data
        // In a real app, you would use an API call
        const mockResources: Resource[] = [
          {
            resourceId: 1,
            courseId: 1,
            title: 'React Fundamentals Slides',
            type: 'document',
            url: 'https://example.com/resources/react-slides.pdf',
            description: 'Slide deck covering React basics',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            resourceId: 2,
            courseId: 1,
            title: 'React Hooks Demo Code',
            type: 'code',
            url: 'https://github.com/example/react-hooks-demo',
            description: 'Code examples for React hooks',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            resourceId: 3,
            courseId: 2,
            title: 'Azure Setup Guide',
            type: 'document',
            url: 'https://example.com/resources/azure-setup.pdf',
            description: 'Step-by-step guide for Azure setup',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];
        
        setResources(mockResources);
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
    resource.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddResource = () => {
    toast({
      title: 'Add Resource',
      description: 'Resource creation feature coming soon',
    });
  };

  // Fixed by ensuring accessorKey matches exact keys in Resource type
  const resourceColumns = [
    {
      accessorKey: 'title' as keyof Resource,
      header: 'Resource Title',
      cell: (row: Resource) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
            {row.type === 'document' ? (
              <File className="h-5 w-5 text-primary" />
            ) : (
              <Book className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <p className="font-medium">{row.title}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type' as keyof Resource,
      header: 'Type',
      cell: (row: Resource) => (
        <span className="capitalize">{row.type}</span>
      ),
    },
    {
      accessorKey: 'courseId' as keyof Resource,
      header: 'Course',
      cell: (row: Resource) => {
        // Mock course names based on courseId
        const courseNames: Record<number, string> = {
          1: 'Introduction to React',
          2: 'Azure Certification Training',
          3: 'Advanced K8s concepts'
        };
        
        return courseNames[row.courseId] || 'Unknown Course';
      },
    },
    {
      accessorKey: 'url' as keyof Resource,
      header: 'Resource Link',
      cell: (row: Resource) => (
        <a 
          href={row.url} 
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
    <Layout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold">Learning Resources</h1>
          <Button onClick={handleAddResource}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
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
    </Layout>
  );
};

export default Resources;
