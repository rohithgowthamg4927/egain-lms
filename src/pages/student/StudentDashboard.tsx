// Import necessary components and hooks
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, FileText, BookOpen, ChevronRight, FileVideo, FileImage, FileAudio, File, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getStudentCourses, getStudentSchedules } from '@/lib/api/students';
import { getResourcesByBatch, getResourcePresignedUrl } from '@/lib/api/resources';
import { apiFetch } from '@/lib/api/core';
import { useNavigate } from 'react-router-dom';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Resource } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.userId) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user?.userId) return;
    
    setIsLoading(true);
    try {
      // Fetch courses
      const coursesResponse = await getStudentCourses(user.userId);
      if (coursesResponse.success && coursesResponse.data) {
        setCourses(coursesResponse.data);
      }

      // Fetch schedules
      const schedulesResponse = await getStudentSchedules(user.userId);
      if (schedulesResponse.success && schedulesResponse.data) {
        setSchedules(schedulesResponse.data);
      }

      // Fetch enrolled batches first
      const batchesResponse = await apiFetch<any[]>(`/student-batches/${user.userId}`);
      if (batchesResponse.success && batchesResponse.data) {
        // Transform the student batches data
        const transformedBatches = batchesResponse.data.map(sb => ({
          batchId: sb.batch.batchId,
          batchName: sb.batch.batchName,
          course: {
            courseId: sb.batch.course.courseId,
            courseName: sb.batch.course.courseName
          }
        }));
        
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
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format schedule time
  const formatTime = (timeString) => {
    try {
      const date = new Date(`1970-01-01T${timeString}`);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return timeString;
    }
  };

  // Format schedule date
  const formatScheduleDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  // Calculate upcoming schedules (next 7 days)
  const upcomingSchedules = schedules
    .filter(schedule => {
      try {
        const scheduleDate = new Date(schedule.scheduleDate);
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        return scheduleDate >= today && scheduleDate <= sevenDaysFromNow;
      } catch (error) {
        return false; // Skip items with invalid dates
      }
    })
    .sort((a, b) => new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime())
    .slice(0, 5);

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

  const getResourceType = (resource: Resource): string => {
    const fileName = resource.fileName?.toLowerCase() || '';
    const type = resource.type?.toLowerCase() || '';
    
    // Check if it's a video file by extension or type
    if (fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.avi') || 
        type === 'recording' || type === 'video') {
      return 'recording';
    } else if (fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx') || 
             fileName.endsWith('.ppt') || fileName.endsWith('.pptx') || fileName.endsWith('.txt') || 
             type === 'assignment' || type === 'document') {
      return 'assignment';
    } else {
      return 'assignment';
    }
  };

  const isVideoResource = (resource: Resource): boolean => {
    const fileName = resource.fileName?.toLowerCase() || '';
    const extension = fileName.split('.').pop();
    const resourceType = getResourceType(resource);
    
    return resourceType === 'recording' || 
           ['mp4', 'mov', 'avi', 'webm'].includes(extension || '');
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

  // Filter resources based on type
  const filteredResources = resources.filter(resource => {
    if (activeTab === 'all') return true;
    const resourceType = getResourceType(resource);
    if (activeTab === 'assignments') return resourceType === 'assignment';
    if (activeTab === 'recordings') return resourceType === 'recording';
    return true;
  });

  // Get recent resources (last 5)
  const recentResources = [...filteredResources]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Dashboard', link: '/student/dashboard' }
      ]} />
      
      <h1 className="text-3xl font-bold">Student Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back, {user?.fullName}. Here's an overview of your learning journey.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingSchedules.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Resources</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentResources.length}</div>
              </CardContent>
            </Card>
            
            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card> */}
          </div>

          <Tabs defaultValue="schedule" className="space-y-4">
            <TabsList>
              <TabsTrigger value="schedule">Upcoming Schedules</TabsTrigger>
              <TabsTrigger value="resources">Recent Resources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="schedule" className="space-y-4">
              <div className="grid gap-4 grid-cols-1">
                {upcomingSchedules.length > 0 ? (
                  upcomingSchedules.map((schedule) => (
                    <Card key={schedule.scheduleId}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{schedule.topic || 'Class Session'}</h3>
                              <p className="text-sm text-muted-foreground">
                                {schedule.batch?.course?.courseName} - {schedule.batch?.batchName}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col md:items-end gap-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{formatScheduleDate(schedule.scheduleDate)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No upcoming classes scheduled.</p>
                    </CardContent>
                  </Card>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/student/schedules')}
                >
                  View All Schedules
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="resources" className="space-y-4">
              <div className="flex justify-between items-center">
                <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="recordings">Class Recordings</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/student/resources')}
                >
                  View All Resources
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 grid-cols-1">
                {recentResources.length > 0 ? (
                  recentResources.map((resource) => (
                    <Card key={resource.resourceId}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-2 rounded-full">
                              {getFileIcon(resource)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{resource.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {resource.batch?.course?.courseName} - {resource.batch?.batchName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{format(new Date(resource.createdAt), 'PPP')}</span>
                              </div>
                              <Badge variant={isVideoResource(resource) ? 'destructive' : 'default'}>
                                {isVideoResource(resource) ? 'Class Recording' : 'Assignment'}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleView(resource)}
                              disabled={downloadingId === resource.resourceId}
                              className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
                            >
                              {downloadingId === resource.resourceId ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4 mr-2" />
                              )}
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">No resources available yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
