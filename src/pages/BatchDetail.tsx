
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getBatchById, getUsers, unenrollStudentFromBatch, enrollStudentToBatch } from '@/lib/api';
import { Batch, User, Role } from '@/lib/types';
import Layout from '@/components/layout/Layout';
import {
  Calendar as CalendarIcon,
  Clock,
  GraduationCap,
  Link as LinkIcon,
  Users,
  Plus,
  ArrowLeft,
  User as UserIcon,
  Trash
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const batchId = parseInt(id || '0');
  const navigate = useNavigate();
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBatchDetails = async () => {
    if (!batchId) return;
    
    try {
      setIsLoading(true);
      const batchResponse = await getBatchById(batchId);
      
      if (batchResponse.success && batchResponse.data) {
        setBatch(batchResponse.data);
      } else {
        toast({
          title: 'Error',
          description: batchResponse.error || 'Failed to fetch batch details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching batch details:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchBatchDetails();
      
      try {
        const studentsResponse = await getUsers(Role.student);
        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    
    fetchData();
  }, [batchId]);

  const handleEnrollStudent = async () => {
    if (!batch || !selectedStudentId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a student to enroll',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await enrollStudentToBatch(parseInt(selectedStudentId), batch.batchId);
      
      if (response.success) {
        toast({
          title: 'Student enrolled',
          description: 'Student has been enrolled to this batch successfully.',
        });
        
        // Reset selected student
        setSelectedStudentId('');
        
        // Close the dialog
        setIsEnrollDialogOpen(false);
        
        // Refresh the batch details
        await fetchBatchDetails();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to enroll student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        title: 'Error',
        description: 'Failed to enroll student',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!batch) return;
    
    try {
      const response = await unenrollStudentFromBatch(studentId, batch.batchId);
      
      if (response.success) {
        toast({
          title: 'Student removed',
          description: 'Student has been removed from this batch successfully.',
        });
        
        // Refresh the batch details
        await fetchBatchDetails();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to remove student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove student',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="mt-4">Loading batch details...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!batch) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <h2 className="text-2xl font-bold mb-4">Batch Not Found</h2>
          <p className="text-muted-foreground mb-6">The batch you are looking for does not exist or has been deleted.</p>
          <Button onClick={() => navigate('/batches')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Batches
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex items-center mb-6 gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/batches')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{batch.batchName}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Course</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xl font-medium">{batch.course?.courseName || 'N/A'}</span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Instructor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xl font-medium">{batch.instructor?.fullName || 'N/A'}</span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-xl font-medium">{batch.students?.length || 0}</span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Start Date:</span>
                  <span className="ml-2">{format(new Date(batch.startDate), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">End Date:</span>
                  <span className="ml-2">{format(new Date(batch.endDate), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Duration:</span>
                  <span className="ml-2">
                    {Math.ceil((new Date(batch.endDate).getTime() - new Date(batch.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Meeting Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Meeting Link:</span>
                  {batch.meetingLink ? (
                    <a 
                      href={batch.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-primary hover:underline truncate max-w-[200px]"
                    >
                      {batch.meetingLink}
                    </a>
                  ) : (
                    <span className="ml-2 text-muted-foreground">Not available</span>
                  )}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Capacity:</span>
                  <span className="ml-2">{batch.capacity || 'Unlimited'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="bg-card rounded-lg border mb-6">
          <TabsList className="p-4 border-b w-full justify-start">
            <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Enrolled Students</h3>
              <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Enroll Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enroll Student</DialogTitle>
                    <DialogDescription>
                      Select a student to enroll in this batch.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="studentSelect">Student</Label>
                      <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                        <SelectTrigger id="studentSelect">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students
                            .filter(student => 
                              !batch.students?.some(
                                enrollment => enrollment.studentId === student.userId
                              )
                            )
                            .map(student => (
                              <SelectItem key={student.userId} value={student.userId.toString()}>
                                {student.fullName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleEnrollStudent} 
                      disabled={isSubmitting || !selectedStudentId}
                    >
                      {isSubmitting ? 'Enrolling...' : 'Enroll'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {batch.students && batch.students.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Enrollment Date</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.students.map(enrollment => (
                      <TableRow key={enrollment.studentBatchId}>
                        <TableCell>
                          <div className="font-medium">{enrollment.student?.fullName}</div>
                        </TableCell>
                        <TableCell>{enrollment.student?.email}</TableCell>
                        <TableCell>{enrollment.student?.phoneNumber || 'N/A'}</TableCell>
                        <TableCell>
                          {enrollment.enrollmentDate
                            ? format(new Date(enrollment.enrollmentDate), 'MMM d, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveStudent(enrollment.studentId)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No students enrolled</h3>
                <p className="text-muted-foreground">Enroll students to this batch using the button above.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Class Schedule</h3>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </div>

            {batch.schedules && batch.schedules.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Meeting Link</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.schedules.map(schedule => (
                      <TableRow key={schedule.scheduleId}>
                        <TableCell>
                          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][schedule.dayOfWeek]}
                        </TableCell>
                        <TableCell>{format(new Date(`2022-01-01T${schedule.startTime}`), 'h:mm a')}</TableCell>
                        <TableCell>{format(new Date(`2022-01-01T${schedule.endTime}`), 'h:mm a')}</TableCell>
                        <TableCell>
                          {schedule.meetingLink ? (
                            <a 
                              href={schedule.meetingLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Join Meeting
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No schedule available</h3>
                <p className="text-muted-foreground">Add class schedule using the button above.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BatchDetail;
