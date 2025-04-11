
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getStudentResources } from '@/lib/api/resources';
import { getStudentBatches } from '@/lib/api/students';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResourceGrid from '@/components/resources/ResourceGrid';
import ResourceList from '@/components/resources/ResourceList';
import { Search, Filter } from 'lucide-react';

const StudentResources = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  
  // Get student's batches
  const batchesQuery = useQuery({
    queryKey: ['studentBatches', user?.userId],
    queryFn: () => (user?.userId ? getStudentBatches(user.userId) : Promise.resolve({ success: false, data: [] })),
    enabled: !!user?.userId,
  });
  
  // Get all resources for the student's batches
  const resourcesQuery = useQuery({
    queryKey: ['studentResources', user?.userId, selectedBatch],
    queryFn: () => {
      if (!user?.userId) return Promise.resolve({ success: false, data: [] });
      
      if (selectedBatch && selectedBatch !== 'all') {
        return getStudentResources(user.userId, parseInt(selectedBatch, 10));
      }
      
      return getStudentResources(user.userId);
    },
    enabled: !!user?.userId,
  });
  
  const isLoading = batchesQuery.isLoading || resourcesQuery.isLoading;
  const batches = batchesQuery.data?.data || [];
  
  // Filter resources
  const filteredResources = resourcesQuery.data?.data?.filter(resource => {
    const matchesSearch = searchQuery
      ? (resource.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         resource.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
      
    const matchesType = selectedType
      ? resource.type === selectedType
      : true;
      
    return matchesSearch && matchesType;
  }) || [];
  
  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Resources', link: '/resources' }
      ]} />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">My Resources</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resources Library</CardTitle>
          <CardDescription>Browse and download learning materials for your courses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search resources..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="w-full sm:w-48">
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {batches.map(batch => (
                      <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                        {batch.batch?.batchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-48">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="grid" className="space-y-4">
            <TabsList>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid">
              <ResourceGrid 
                resources={filteredResources} 
                onDelete={() => {}} 
                userRole="student"
              />
            </TabsContent>
            
            <TabsContent value="list">
              <ResourceList 
                resources={filteredResources} 
                userRole="student"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentResources;
