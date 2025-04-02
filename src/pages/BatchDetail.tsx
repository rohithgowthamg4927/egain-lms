
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { getBatch, getBatchStudents, getSchedules, unenrollStudentFromBatch } from '@/lib/api';
import { Batch, Schedule, User } from '@/lib/types';
import { 
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  Badge,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui';
import { 
  Calendar, 
  ChevronLeft, 
  Clock, 
  Edit, 
  FileText, 
  CalendarDays, 
  Settings,
  Users,
  User as UserIcon,
  BookOpen,
  Trash
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { format } from 'date-fns';
import { getInitials } from '@/lib/utils';

const BatchDetail = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBatchData = async () => {
      setIsLoading(true);
      
      if (!batchId) {
        toast({
          title: 'Error',
          description: 'Batch ID is missing',
          variant: 'destructive',
        });
        navigate('/batches');
        return;
      }
      
      try {
        const [batchResponse, studentsResponse, schedulesResponse] = await Promise.all([
          getBatch(parseInt(batchId)),
          getBatchStudents(parseInt(batchId)),
          getSchedules({ batchId: parseInt(batchId) })
        ]);
        
        if (batchResponse.success && batchResponse.data) {
          setBatch(batchResponse.data);
        } else {
          toast({
            title: 'Error',
            description: batchResponse.error || 'Failed to fetch batch details',
            variant: 'destructive',
          });
          navigate('/batches');
          return;
        }
        
        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data);
        }
        
        if (schedulesResponse.success && schedulesResponse.data) {
          setSchedules(schedulesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching batch data:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBatchData();
  }, [batchId, navigate, toast]);

  const studentColumns = [
    {
      accessorKey: 'fullName',
      header: 'Name',
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={row.original.profilePicture?.fileUrl} />
            <AvatarFallback>{getInitials(row.original.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.original.fullName}</p>
            <p className="text-sm text-gray-500">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: { row: { original: User } }) => row.original.email,
    },
    {
      accessorKey: 'phoneNumber',
      header: 'Phone',
      cell: ({ row }: { row: { original: User } }) => row.original.phoneNumber || 'N/A',
    },
    {
      accessorKey: 'enrollmentDate',
      header: 'Enrolled On',
      cell: ({ row }: { row: { original: User & { enrollmentDate?: string } } }) => 
        row.original.enrollmentDate ? format(new Date(row.original.enrollmentDate), 'MMM d, yyyy') : 'N/A',
    },
  ];

  const handleRemoveStudent = async (student: User) => {
    if (!batchId) return;
    
    try {
      const response = await unenrollStudentFromBatch(student.userId, parseInt(batchId));
      
      if (response.success) {
        toast({
          title: 'Student removed',
          description: `${student.fullName} has been removed from this batch.`,
        });
        
        // Update local state
        setStudents(students.filter(s => s.userId !== student.userId));
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

  const studentActions = [
    {
      label: 'View Profile',
      onClick: (student: User) => {
        navigate(`/students/${student.userId}`);
      },
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      label: 'Remove from Batch',
      onClick: (student: User) => {
        // Show confirmation dialog
        if (window.confirm(`Are you sure you want to remove ${student.fullName} from this batch?`)) {
          handleRemoveStudent(student);
        }
      },
      icon: <Trash className="h-4 w-4" />,
    },
  ];

  const handleEditBatch = () => {
    navigate(`/batches?action=edit&batchId=${batchId}`);
  };

  const handleGoBack = () => {
    navigate('/batches');
  };

  if (isLoading) {
    return (
      <Layout noHeader={true}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (!batch) {
    return (
      <Layout noHeader={true}>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Batch not found</h2>
          <p className="text-gray-500 mt-2">The batch you're looking for doesn't exist or has been removed.</p>
          <Button onClick={handleGoBack} variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Batches
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout noHeader={true}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleGoBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">{batch.batchName}</h1>
            {new Date(batch.startDate) > new Date() ? (
              <Badge className="ml-2 bg-blue-500">Upcoming</Badge>
            ) : new Date(batch.endDate) < new Date() ? (
              <Badge className="ml-2 bg-gray-500">Completed</Badge>
            ) : (
              <Badge className="ml-2 bg-green-500">Active</Badge>
            )}
          </div>
          <Button onClick={handleEditBatch} className="bg-blue-600 hover:bg-blue-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Batch
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-md border-blue-100 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span>Course Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{batch.course?.courseName || 'N/A'}</h3>
                <p className="text-gray-500 mt-1">{batch.course?.description || 'No description available'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600/10 p-2 rounded-md">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium">
                        {format(new Date(batch.startDate), 'MMM d, yyyy')} - {format(new Date(batch.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600/10 p-2 rounded-md">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Enrolled Students</p>
                      <p className="font-medium">{students.length} students</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                <span>Instructor</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {batch.instructor ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={batch.instructor.profilePicture?.fileUrl} />
                    <AvatarFallback>{getInitials(batch.instructor.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{batch.instructor.fullName}</h3>
                    <p className="text-sm text-gray-500">{batch.instructor.email}</p>
                    <p className="text-sm text-gray-500 mt-1">{batch.instructor.phoneNumber || 'No phone number'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No instructor assigned</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedules
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-2">
              <FileText className="h-4 w-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="students" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Enrolled Students</CardTitle>
                  <Button 
                    onClick={() => navigate(`/batches?action=manageStudents&batchId=${batchId}`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Students
                  </Button>
                </div>
                <CardDescription>
                  {students.length} student{students.length !== 1 ? 's' : ''} enrolled in this batch
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium">No students enrolled</h3>
                    <p className="text-gray-500 mt-1">Enroll students to get started</p>
                  </div>
                ) : (
                  <DataTable
                    data={students}
                    columns={studentColumns}
                    actions={studentActions}
                    searchKey="fullName"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="schedules" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Class Schedules</CardTitle>
                  <Button 
                    onClick={() => navigate(`/schedules?batchId=${batchId}`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Schedules
                  </Button>
                </div>
                <CardDescription>
                  {schedules.length} class schedule{schedules.length !== 1 ? 's' : ''} for this batch
                </CardDescription>
              </CardHeader>
              <CardContent>
                {schedules.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium">No schedules found</h3>
                    <p className="text-gray-500 mt-1">Add class schedules to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <div 
                        key={schedule.scheduleId} 
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="bg-blue-600/10 p-3 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{schedule.topic}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(new Date(schedule.startTime), 'EEEE, MMMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(schedule.startTime), 'h:mm a')} - {format(new Date(schedule.endTime), 'h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="resources" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Course Resources</CardTitle>
                <CardDescription>
                  Learning materials for this batch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium">No resources available</h3>
                  <p className="text-gray-500 mt-1">
                    Course resources will be added soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Batch Settings</CardTitle>
                <CardDescription>
                  Manage batch settings and operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Batch Operations</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Edit className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Edit Batch Details</p>
                          <p className="text-sm text-gray-500">Update batch name, course, instructor, or dates</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleEditBatch}
                      >
                        Edit
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Trash className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">Delete Batch</p>
                          <p className="text-sm text-gray-500">Permanently delete this batch and all related data</p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the batch
                              and all of its associated data including student enrollments and schedules.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => {
                                // Handle batch deletion
                                // Redirect to batches list after deletion
                                navigate('/batches');
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BatchDetail;
