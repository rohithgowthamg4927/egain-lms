import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBatch, getBatchStudents, deleteBatch, unenrollStudentFromBatch } from '@/lib/api/batches';
import { getSchedules } from '@/lib/api/schedules';
import { getResourcesByBatch, deleteResource, getResourcePresignedUrl } from '@/lib/api/resources';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Batch, User, Schedule, Resource } from '@/lib/types';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { formatDate, getInitials } from '@/lib/utils';
import { Edit, Trash2, Calendar, Users, AlertTriangle, RefreshCw, UserMinus, FileText, Plus, FileVideo, FileImage, FileAudio, Eye, Loader2, File } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@/lib/types';
import { UploadResourceDialog } from '@/components/resources/UploadResourceDialog';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

const BatchDetail = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  const isInstructor = user?.role === Role.instructor;

  // Add state for checking if instructor is assigned to this batch
  const [isInstructorAssigned, setIsInstructorAssigned] = useState(false);

  // Fetch batch details with proper access control
  const { data: batch, isLoading: isBatchLoading } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () => {
      if (!batchId) throw new Error('No batch ID provided');
      const response = await getBatch(Number(batchId));
      if (!response.success) throw new Error(response.error || 'Failed to fetch batch');
      return response.data;
    },
    enabled: !!batchId,
  });

  // Fetch students
  const { data: students = [] } = useQuery({
    queryKey: ['batchStudents', batchId],
    queryFn: async () => {
      if (!batchId) throw new Error('No batch ID provided');
      const response = await getBatchStudents(Number(batchId));
      if (!response.success) throw new Error(response.error || 'Failed to fetch students');
      return response.data;
    },
    enabled: !!batchId,
  });

  // Fetch schedules
  const { data: schedules = [] } = useQuery({
    queryKey: ['batchSchedules', batchId],
    queryFn: async () => {
      if (!batchId) throw new Error('No batch ID provided');
      const response = await getSchedules({ batchId: Number(batchId) });
      if (!response.success) throw new Error(response.error || 'Failed to fetch schedules');
      return response.data;
    },
    enabled: !!batchId,
  });

  // Fetch resources with proper access control
  const { data: resources = [] } = useQuery({
    queryKey: ['batchResources', batchId],
    queryFn: async () => {
      if (!batchId) throw new Error('No batch ID provided');
      
      // Check if instructor is assigned to this batch
      if (isInstructor && user?.userId && batch?.instructor?.userId !== user.userId) {
        throw new Error('Access denied: You are not assigned to this batch');
      }
      
      const response = await getResourcesByBatch(batchId.toString());
      if (!response.success) throw new Error(response.error || 'Failed to fetch resources');
      return response.data;
    },
    enabled: !!batchId && (isAdmin || (isInstructor && batch?.instructor?.userId === user?.userId)),
  });

  // Check instructor assignment
  useEffect(() => {
    if (batch && isInstructor && user?.userId) {
      const isAssigned = batch.instructor?.userId === user.userId;
      setIsInstructorAssigned(isAssigned);
      
      if (!isAssigned) {
        toast({
          title: 'Access Denied',
          description: 'You are not assigned to this batch',
          variant: 'destructive',
        });
        navigate('/batches');
      }
    }
  }, [batch, isInstructor, user?.userId, navigate, toast]);

  const isBatchInstructor = batch?.instructorId === user?.userId;
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRemovingStudent, setIsRemovingStudent] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const canManageResources = isAdmin || (isInstructor && batch?.instructor?.userId === user?.userId);

  const queryClient = useQueryClient();

  const handleDeleteBatch = async () => {
    if (!batchId) return;
    
    try {
      setIsDeleting(true);
      const response = await deleteBatch(Number(batchId));
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Batch deleted successfully',
        });
        navigate('/batches');
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete batch',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the batch',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleRemoveStudent = async (studentId: number) => {
    if (!batchId) return;
    
    try {
      setIsRemovingStudent(true);
      setRemovingStudentId(studentId);
      
      const response = await unenrollStudentFromBatch(studentId, Number(batchId));
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Student removed from batch successfully',
        });
        // Invalidate the students query to refresh the data
        queryClient.invalidateQueries({ queryKey: ['batchStudents', batchId] });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to remove student from batch',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while removing the student',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingStudent(false);
      setRemovingStudentId(null);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    try {
      setIsLoadingResources(true);
      const response = await deleteResource(resourceId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Resource deleted successfully',
        });
        // Invalidate the resources query to refresh the data
        queryClient.invalidateQueries({ queryKey: ['batchResources', batchId] });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete resource',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the resource',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingResources(false);
    }
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
      return 'Assignment';
    }
  };

  const isVideoResource = (resource: Resource): boolean => {
    const fileName = resource.fileName?.toLowerCase() || '';
    const extension = fileName.split('.').pop();
    const type = resource.type?.toLowerCase() || '';
    
    return type === 'recording' || 
           ['mp4', 'mov', 'avi', 'webm'].includes(extension || '');
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

  const handleDownload = async (resourceId: number) => {
    try {
      setIsDownloading(true);
      setDownloadingId(resourceId);
      const response = await getResourcePresignedUrl(resourceId);
      
      if (response.success && response.data.presignedUrl) {
        window.open(response.data.presignedUrl, '_blank');
      } else {
        throw new Error(response.error || 'Failed to get download URL');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download resource',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
      setIsDownloading(false);
    }
  };

  const handleDeleteClick = (resource: Resource) => {
    setResourceToDelete(resource);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (resourceToDelete) {
      try {
        await handleDeleteResource(resourceToDelete.resourceId);
        setShowDeleteDialog(false);
        setResourceToDelete(null);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete resource',
          variant: 'destructive',
        });
      }
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    if (timeString.length <= 8) {
      return timeString.substring(0, 5);
    }
    return format(new Date(timeString), 'hh:mm a');
  };

  if (isBatchLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <RefreshCw className="animate-spin h-12 w-12 text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading batch details...</p>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-lg text-muted-foreground">{error || 'Batch not found'}</p>
        <Button asChild className="mt-4">
          <Link to="/batches">Go Back to Batches</Link>
        </Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Batches', link: '/batches' },
    { label: batch.batchName, link: `/batches/${batchId}` },
  ];

  const handleManageStudents = () => {
    navigate(`/batches/manage-students?batchId=${batchId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BreadcrumbNav items={breadcrumbItems} />
          <h1 className="text-3xl font-bold mt-2">{batch.batchName}</h1>
          <p className="text-muted-foreground">{`Batch ID: ${batch.batchId}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button asChild size="sm" variant="outline">
                <Link to={`/batches/${batchId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Batch
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Batch
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Batch</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this batch? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteBatch}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Batch Details</CardTitle>
            <CardDescription>Information about this batch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Course</h3>
                <p className="text-lg font-medium">{batch.course?.courseName || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Instructor</h3>
                {batch.instructor ? (
                  isAdmin ? (
                    <Link 
                      to={`/instructors/${batch.instructor.userId}`}
                      className="text-lg font-medium hover:underline"
                    >
                      {batch.instructor.fullName}
                    </Link>
                  ) : (
                    <p className="text-lg font-medium">{batch.instructor.fullName}</p>
                  )
                ) : (
                  <p className="text-lg font-medium">N/A</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
                <p className="text-lg font-medium">{formatDate(batch.startDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
                <p className="text-lg font-medium">{formatDate(batch.endDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Students Enrolled</h3>
                <p className="text-lg font-medium">{students.length}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Schedule Count</h3>
                <p className="text-lg font-medium">{schedules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage this batch</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {isAdmin && (
              <>
                <Button asChild className="justify-start">
                  <Link to={`/batches/${batchId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Batch Details
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start" 
                  onClick={handleManageStudents}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Students
                </Button>
              </>
            )}
            <Button asChild variant="secondary" className="justify-start">
              <Link to="/schedules">
                <Calendar className="h-4 w-4 mr-2" />
                Manage Schedules
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-2" />
            Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Calendar className="h-4 w-4 mr-2" />
            Schedules ({schedules.length})
          </TabsTrigger>
          {(isAdmin || isInstructor) && (
            <TabsTrigger value="resources">
              <FileText className="h-4 w-4 mr-2" />
              Resources ({resources.length})
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="students" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <CardDescription>List of students in this batch</CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No students enrolled in this batch yet.</p>
                  {isAdmin && (
                    <Button onClick={handleManageStudents} className="mt-4">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Students
                    </Button>
                  )}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        {isAdmin && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.userId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link to={`/students/${student.userId}`}>
                                <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                  <AvatarImage src={student.profilePicture?.fileUrl} alt={student.fullName} />
                                  <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
                                </Avatar>
                              </Link>
                              <div>
                                <p className="font-medium">{`${student.fullName  || ''}`}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phoneNumber || 'N/A'}</TableCell>
                          {isAdmin && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button asChild size="sm" className="bg-green-700 hover:bg-green-800 text-white">
                                  <Link to={`/students/${student.userId}`}>View Profile</Link>
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="destructive" 
                                      className="flex items-center gap-1"
                                      disabled={isRemovingStudent && removingStudentId === student.userId}
                                    >
                                      {isRemovingStudent && removingStudentId === student.userId ? (
                                        <RefreshCw className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <UserMinus className="h-3 w-3" />
                                      )}
                                      Remove
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Remove Student</DialogTitle>
                                      <DialogDescription>
                                        Are you sure you want to remove {student.fullName} from this batch? They will lose access to this batch's resources.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                      <Button type="button" variant="outline" onClick={() => {}}>
                                        Cancel
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => handleRemoveStudent(student.userId)}
                                        disabled={isRemovingStudent}
                                      >
                                        {isRemovingStudent && removingStudentId === student.userId ? (
                                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <UserMinus className="h-4 w-4 mr-2" />
                                        )}
                                        Remove Student
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="schedules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Schedules</CardTitle>
              <CardDescription>List of scheduled classes for this batch</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No schedules for this batch yet.</p>
                  <Button asChild className="mt-4">
                    <Link to="/schedules">
                      <Calendar className="h-4 w-4 mr-2" />
                      Manage Schedules
                    </Link>
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Meeting Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow key={schedule.scheduleId}>
                          <TableCell>{format(new Date(schedule.scheduleDate), 'PPP')}</TableCell>
                          <TableCell>{schedule.topic}</TableCell>
                          <TableCell>{formatTime(schedule.startTime)}</TableCell>
                          <TableCell>{formatTime(schedule.endTime)}</TableCell>
                          <TableCell>
                            {schedule.meetingLink ? (
                              <Button asChild size="sm" variant="link">
                                <a href={schedule.meetingLink} target="_blank" rel="noopener noreferrer">
                                  Join Meeting
                                </a>
                              </Button>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild size="sm">
                <Link to="/schedules">
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Schedules
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        {(isAdmin || isInstructor) && (
          <TabsContent value="resources" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Batch Resources</CardTitle>
                  <CardDescription>Manage resources for this batch</CardDescription>
                </div>
                {canManageResources && (
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {resources.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No resources added to this batch yet.</p>
                    {canManageResources && (
                      <Button onClick={() => setShowUploadDialog(true)} className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Resource</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Added On</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resources.map((resource) => (
                          <TableRow key={resource.resourceId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getFileIcon(resource)}
                                <span className="font-medium">{resource.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={isVideoResource(resource) ? "destructive" : "default"}
                                className="capitalize"
                              >
                                {getResourceType(resource)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(resource.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleDownload(resource.resourceId)}
                                  disabled={downloadingId === resource.resourceId || isDownloading}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {downloadingId === resource.resourceId || isDownloading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Loading...
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View/Download
                                    </>
                                  )}
                                </Button>
                                {canManageResources && (
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleDeleteClick(resource)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the resource "{resourceToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UploadResourceDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={() => {
          setShowUploadDialog(false);
        }}
        batches={[batch]}
      />
    </div>
  );
};

export default BatchDetail;
