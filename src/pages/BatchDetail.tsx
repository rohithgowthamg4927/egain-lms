
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getBatch, getBatchStudents, deleteBatch } from '@/lib/api/batches';
import { getSchedules } from '@/lib/api/schedules'; 
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
import { Batch, User, Schedule } from '@/lib/types';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { formatDate, getInitials } from '@/lib/utils';
import { Edit, Trash2, Calendar, Users, AlertTriangle, RefreshCw } from 'lucide-react';

const BatchDetail = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatchDetails = async () => {
    if (!batchId) return;

    try {
      setIsLoading(true);
      setError(null);

      const batchResponse = await getBatch(Number(batchId));
      
      if (!batchResponse.success || !batchResponse.data) {
        setError(batchResponse.error || 'Failed to fetch batch details');
        toast({
          title: 'Error',
          description: batchResponse.error || 'Failed to fetch batch details',
          variant: 'destructive',
        });
        return;
      }
      
      setBatch(batchResponse.data);
      
      // Fetch students
      const studentsResponse = await getBatchStudents(Number(batchId));
      
      if (studentsResponse.success && studentsResponse.data) {
        setStudents(studentsResponse.data);
      }

      // Fetch schedules
      const schedulesResponse = await getSchedules({ batchId: Number(batchId) });
      
      if (schedulesResponse.success && schedulesResponse.data) {
        setSchedules(schedulesResponse.data);
      }
    } catch (err) {
      console.error('Error fetching batch details:', err);
      setError('An error occurred while fetching batch details');
      toast({
        title: 'Error',
        description: 'An error occurred while fetching batch details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const handleDeleteBatch = async () => {
    if (!batchId || !batch) return;
    
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
    } catch (err) {
      console.error('Error deleting batch:', err);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting batch',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
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
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'Batches', link: '/batches' },
    { label: batch.batchName, link: `/batches/${batchId}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BreadcrumbNav items={breadcrumbItems} />
          <h1 className="text-3xl font-bold mt-2">{batch.batchName}</h1>
          <p className="text-muted-foreground">{`Batch ID: ${batch.batchId}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={`/batches/${batchId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Batch
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Batch</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this batch? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {}}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteBatch}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <p className="text-lg font-medium">{`${batch.instructor?.fullName || ''}`}</p>
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
            <Button asChild className="justify-start">
              <Link to={`/batches/${batchId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Batch Details
              </Link>
            </Button>
            <Button asChild variant="secondary" className="justify-start">
              <Link to="/schedules">
                <Calendar className="h-4 w-4 mr-2" />
                Manage Schedules
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/batches/manage-students">
                <Users className="h-4 w-4 mr-2" />
                Manage Students
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
                  <Button asChild className="mt-4">
                    <Link to="/batches/manage-students">
                      <Users className="h-4 w-4 mr-2" />
                      Manage Students
                    </Link>
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.userId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar>
                                <AvatarImage src={student.profilePicture?.fileUrl} alt={student.fullName} />
                                <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{`${student.fullName  || ''}`}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phoneNumber || 'N/A'}</TableCell>
                          <TableCell>
                            <Button asChild size="sm" variant="ghost">
                              <Link to={`/students/${student.userId}`}>View Profile</Link>
                            </Button>
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
                        <TableHead>Topic</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Meeting Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules.map((schedule) => (
                        <TableRow key={schedule.scheduleId}>
                          <TableCell>{schedule.topic}</TableCell>
                          <TableCell>{formatDate(schedule.startTime)}</TableCell>
                          <TableCell>{formatDate(schedule.endTime)}</TableCell>
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
      </Tabs>
    </div>
  );
};

export default BatchDetail;
