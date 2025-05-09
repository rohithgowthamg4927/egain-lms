import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  FileText, 
  BookOpen, 
  ChevronRight, 
  FileVideo, 
  FileImage, 
  FileAudio, 
  File, 
  Eye, 
  Loader2, 
  Users, 
  BookOpenCheck,
  GraduationCap,
  BarChart4,
  CalendarDays,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { getStudentCourses } from '@/lib/api/students';
import { getAllSchedules } from '@/lib/api/schedules';
import { getResourcesByBatch, getResourcePresignedUrl } from '@/lib/api/resources';
import { apiFetch } from '@/lib/api/core';
import { useNavigate } from 'react-router-dom';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Resource } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('today');
  const [resourcesTab, setResourcesTab] = useState('all');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: coursesData, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['studentCourses', user?.userId],
    queryFn: () => user?.userId ? getStudentCourses(user.userId) : Promise.resolve({ success: false, data: [] }),
    enabled: !!user?.userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Query for student batches
  const { data: studentBatchesData, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['studentBatches', user?.userId],
    queryFn: async () => {
      if (!user?.userId) throw new Error('User ID required');
      const response = await apiFetch<any>(`/student-batches/${user.userId}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch student batches');
      }
      return response;
    },
    enabled: !!user?.userId
  });

  const { data: schedulesData, isLoading: isSchedulesLoading } = useQuery({
    queryKey: ['studentSchedules', studentBatchesData?.data],
    queryFn: async () => {
      if (!studentBatchesData?.success || !studentBatchesData.data) {
        throw new Error('No batches found');
      }
      
      // Extract batch IDs from student batches
      const batchIds = studentBatchesData.data.map(sb => sb.batch.batchId);
      if (batchIds.length === 0) return { success: true, data: [] };
      
      // Fetch all schedules for these batches
      const schedulesPromises = batchIds.map(batchId => 
        getAllSchedules({ batchId })
      );
      
      const schedulesResults = await Promise.all(schedulesPromises);
      
      // Combine all schedules from different batches
      const allSchedules = schedulesResults.flatMap(result => 
        result.success && result.data ? result.data : []
      );
      
      return { success: true, data: allSchedules };
    },
    enabled: !!studentBatchesData?.data
  });

  const { data: resourcesData, isLoading: isResourcesLoading } = useQuery({
    queryKey: ['studentResources', studentBatchesData?.data],
    queryFn: async () => {
      if (!studentBatchesData?.success || !studentBatchesData.data) return [];
      
      const transformedBatches = studentBatchesData.data.map(sb => ({
        batchId: sb.batch.batchId,
        batchName: sb.batch.batchName,
        course: {
          courseId: sb.batch.course.courseId,
          courseName: sb.batch.course.courseName
        }
      }));
      
      const allResources: Resource[] = [];
      for (const batch of transformedBatches) {
        const resourcesResponse = await getResourcesByBatch(batch.batchId.toString());
        if (resourcesResponse.success && resourcesResponse.data) {
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
      return allResources;
    },
    enabled: !!studentBatchesData?.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const courses = coursesData?.data || [];
  const schedules = schedulesData?.data || [];
  const resources = resourcesData || [];
  const isLoading = isCoursesLoading || isSchedulesLoading || isBatchesLoading || isResourcesLoading;

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      // For full ISO string (from database)
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        return format(date, 'h:mm a');
      }
      // For time-only string (HH:mm:ss)
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return format(date, 'h:mm a');
    } catch (error) {
      return timeString;
    }
  };

  const formatScheduleDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  const todaySchedules = schedules
    .filter(schedule => {
      const scheduleDate = new Date(schedule.scheduleDate);
      const today = new Date();
      
      // Compare only the date part
      return scheduleDate.getFullYear() === today.getFullYear() &&
             scheduleDate.getMonth() === today.getMonth() &&
             scheduleDate.getDate() === today.getDate();
    })
    .sort((a, b) => {
      const timeA = new Date(a.startTime);
      const timeB = new Date(b.startTime);
      return timeA.getTime() - timeB.getTime();
    });

  const upcomingSchedules = schedules
    .filter(schedule => {
      const scheduleDate = new Date(schedule.scheduleDate);
      const scheduleDateTime = new Date(scheduleDate);
      
      // Get time parts from startTime
      if (schedule.startTime.includes('T')) {
        const startTime = new Date(schedule.startTime);
        scheduleDateTime.setHours(startTime.getHours(), startTime.getMinutes());
      } else {
        const [hours, minutes] = schedule.startTime.split(':').map(Number);
        scheduleDateTime.setHours(hours, minutes);
      }
      
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);
      
      return scheduleDateTime > now && scheduleDateTime <= sevenDaysFromNow;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduleDate);
      const dateB = new Date(b.scheduleDate);
      return dateA.getTime() - dateB.getTime();
    });

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
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to view resource',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredResources = resources.filter(resource => {
    if (resourcesTab === 'all') return true;
    const resourceType = getResourceType(resource);
    if (resourcesTab === 'assignments') return resourceType === 'assignment';
    if (resourcesTab === 'recordings') return resourceType === 'recording';
    return true;
  });

  const recentResources = [...filteredResources]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const totalAssignments = resources.filter(r => getResourceType(r) === 'assignment').length;
  const totalRecordings = resources.filter(r => isVideoResource(r)).length;

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Dashboard', link: '/student/dashboard' }
      ]} />
      
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.fullName}. Here's an overview of your learning journey.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-purple-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                <BookOpen className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {studentBatchesData?.data?.length || 0} active batches
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Classes</CardTitle>
                <Calendar className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingSchedules.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Next 7 days
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Resources</CardTitle>
                <FileText className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resources.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalAssignments} assignments, {totalRecordings} recordings
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card className="w-full overflow-hidden border-purple-100">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center justify-between">
                  <CardTitle>Class Schedule</CardTitle>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="today">Today</TabsTrigger>
                      <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsContent value="today" className="m-0">
                    <div className="bg-purple-50/50 p-4">
                      {todaySchedules.length > 0 ? (
                        <div className="space-y-3">
                          {todaySchedules.map((schedule) => (
                            <Card key={schedule.scheduleId} className="border-purple-100 overflow-hidden">
                              <div className="flex flex-col md:flex-row gap-3 p-4">
                                <div className="flex items-center justify-center bg-purple-100 h-12 w-12 rounded-full shrink-0">
                                  <Clock className="h-6 w-6 text-purple-700" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                      <h3 className="font-semibold text-gray-900">
                                        {schedule.topic || 'Class Session'}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        {schedule.batch?.course?.courseName} - {schedule.batch?.batchName}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                      <div className="flex flex-col text-sm">
                                        <span className="text-muted-foreground text-xs">Time</span>
                                        <span className="font-medium text-gray-900">
                                          {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                        </span>
                                      </div>
                                      {schedule.meetingLink && (
                                        <Button 
                                          size="sm" 
                                          className="bg-purple-600 text-white hover:bg-purple-700"
                                          onClick={() => window.open(schedule.meetingLink, '_blank')}
                                        >
                                          Join
                                          <ArrowUpRight className="ml-1 h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-10 w-10 text-purple-300 mx-auto mb-2" />
                          <h3 className="text-lg font-medium text-gray-600">No classes scheduled today</h3>
                          <p className="text-sm text-gray-500 mt-1">Check your upcoming schedule</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="upcoming" className="m-0">
                    <div className="bg-purple-50/50 p-4">
                      {upcomingSchedules.length > 0 ? (
                        <div className="space-y-3">
                          {upcomingSchedules.map((schedule) => (
                            <Card key={schedule.scheduleId} className="border-purple-100 overflow-hidden">
                              <div className="flex flex-col md:flex-row gap-3 p-4">
                                <div className="flex items-center justify-center bg-purple-100 h-12 w-12 rounded-full shrink-0">
                                  <Calendar className="h-6 w-6 text-purple-700" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                      <h3 className="font-semibold text-gray-900">
                                        {schedule.topic || 'Class Session'}
                                      </h3>
                                      <p className="text-sm text-gray-600">
                                        {schedule.batch?.course?.courseName} - {schedule.batch?.batchName}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                      <div className="flex flex-col text-sm space-y-1">
                                        <div className="flex items-center gap-2">
                                          <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
                                          <span className="text-gray-600">
                                            {formatScheduleDate(schedule.scheduleDate)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                                          <span className="font-medium text-gray-900">
                                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                          </span>
                                        </div>
                                      </div>
                                      {schedule.meetingLink && (
                                        <Button 
                                          size="sm" 
                                          className="bg-purple-600 text-white hover:bg-purple-700"
                                          onClick={() => window.open(schedule.meetingLink, '_blank')}
                                        >
                                          Join
                                          <ArrowUpRight className="ml-1 h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="h-10 w-10 text-purple-300 mx-auto mb-2" />
                          <h3 className="text-lg font-medium text-gray-600">No upcoming classes</h3>
                          <p className="text-sm text-gray-500 mt-1">Check back later</p>
                        </div>
                      )}
                      <div className="mt-4 text-center">
                        <Button 
                          variant="outline" 
                          className="w-full md:w-auto"
                          onClick={() => navigate('/student/schedules')}
                        >
                          View Full Schedule
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <Card className="w-full overflow-hidden border-green-100">
            <CardHeader className="bg-gradient-to-r from-green-50 to-white">
              <div className="flex justify-between items-center">
                <CardTitle>Learning Resources</CardTitle>
                <Tabs value={resourcesTab} onValueChange={setResourcesTab} className="w-auto">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="assignments">Assignments</TabsTrigger>
                    <TabsTrigger value="recordings">Recordings</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardDescription>Recently added learning materials</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={resourcesTab} onValueChange={setResourcesTab}>
                <TabsContent value="all" className="m-0">
                  <div className="bg-green-50/50 p-4">
                    {recentResources.length > 0 ? (
                      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {recentResources.map((resource) => (
                          <Card key={resource.resourceId} className="overflow-hidden border-green-100 hover:border-green-300 transition-colors">
                            <CardContent className="p-0">
                              <div className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="bg-green-100 p-2 rounded-full">
                                    {getFileIcon(resource)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
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
                              <div className="bg-gray-50 px-4 py-2 border-t border-green-100 flex justify-end">
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
                                  View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-10 w-10 text-green-300 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-600">No resources available</h3>
                        <p className="text-sm text-gray-500 mt-1">Resources will appear here when they're added</p>
                      </div>
                    )}
                    <div className="mt-4 text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/student/resources')}
                        className="w-full md:w-auto"
                      >
                        View All Resources
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="assignments" className="m-0">
                  <div className="bg-green-50/50 p-4">
                    {recentResources.filter(r => getResourceType(r) === 'assignment').length > 0 ? (
                      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {recentResources
                          .filter(r => getResourceType(r) === 'assignment')
                          .map((resource) => (
                            <Card key={resource.resourceId} className="overflow-hidden border-green-100 hover:border-green-300 transition-colors">
                              <CardContent className="p-0">
                                <div className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="bg-green-100 p-2 rounded-full">
                                      {getFileIcon(resource)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
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
                                <div className="bg-gray-50 px-4 py-2 border-t border-green-100 flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleView(resource)}
                                    disabled={downloadingId === resource.resourceId}
                                    className="bg-white hover:bg-green-50"
                                  >
                                    {downloadingId === resource.resourceId ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Eye className="h-4 w-4 mr-2" />
                                    )}
                                    View
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-10 w-10 text-green-300 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-600">No assignments available</h3>
                        <p className="text-sm text-gray-500 mt-1">Assignments will appear here when they're added</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="recordings" className="m-0">
                  <div className="bg-green-50/50 p-4">
                    {recentResources.filter(r => isVideoResource(r)).length > 0 ? (
                      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {recentResources
                          .filter(r => isVideoResource(r))
                          .map((resource) => (
                            <Card key={resource.resourceId} className="overflow-hidden border-green-100 hover:border-green-300 transition-colors">
                              <CardContent className="p-0">
                                <div className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="bg-red-100 p-2 rounded-full">
                                      <FileVideo className="h-6 w-6 text-red-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
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
                                <div className="bg-gray-50 px-4 py-2 border-t border-green-100 flex justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleView(resource)}
                                    disabled={downloadingId === resource.resourceId}
                                    className="bg-white hover:bg-green-50"
                                  >
                                    {downloadingId === resource.resourceId ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Eye className="h-4 w-4 mr-2" />
                                    )}
                                    View
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileVideo className="h-10 w-10 text-red-300 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-600">No recordings available</h3>
                        <p className="text-sm text-gray-500 mt-1">Recordings will appear here when they're added</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
