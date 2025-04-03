import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getBatch, deleteBatch } from '@/lib/api';
import { getAllSchedules } from '@/lib/api/schedules'; // Changed import to getAllSchedules
import { Batch, Schedule, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils/date-helpers';
import { getInitials } from '@/lib/utils';
import { CalendarPlus, CalendarRange, Calendar, ChevronLeft, Edit, Trash2, Users2, BookOpen, GraduationCap, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface BatchDetailProps {}

const BatchDetail: React.FC<BatchDetailProps> = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchBatchDetails = async () => {
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
        const batchIdNum = parseInt(batchId);
        const response = await getBatch(batchIdNum);

        if (response.success && response.data) {
          setBatch(response.data);
          setStudents(response.data.students || []);
        } else {
          toast({
            title: 'Error',
            description: response.error || 'Failed to fetch batch details',
            variant: 'destructive',
          });
          navigate('/batches');
          return;
        }

        // Fetch schedules for the batch
        const schedulesResponse = await getAllSchedules({ batchId: batchIdNum });
        if (schedulesResponse.success && schedulesResponse.data) {
          setSchedules(schedulesResponse.data);
        } else {
          toast({
            title: 'Error',
            description: schedulesResponse.error || 'Failed to fetch schedules for this batch',
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

    fetchBatchDetails();
  }, [batchId, navigate, toast]);

  const handleDeleteBatch = async () => {
    if (!batchId) return;

    try {
      const batchIdNum = parseInt(batchId);
      const response = await deleteBatch(batchIdNum);

      if (response.success) {
        toast({
          title: 'Batch deleted',
          description: 'Batch has been deleted successfully',
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
      console.error('Error deleting batch:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteOpen(false);
    }
  };

  const handleGoBack = () => {
    navigate('/batches');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Batch not found</h2>
        <p className="text-gray-500 mt-2">The batch you're looking for doesn't exist or has been removed.</p>
        <Button onClick={handleGoBack} variant="outline" className="mt-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{batch.batchName}</h1>
          <Badge className="ml-2">{batch.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/batches/${batch.batchId}/edit`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Batch
          </Button>
          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Batch
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Batch</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this batch? This action cannot be undone.
                  All associated data including schedules and student enrollments will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteBatch} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md border-blue-100 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <span>Batch Information</span>
            </CardTitle>
            <CardDescription>Details about the batch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">{batch.batchName}</h3>
              <p className="text-gray-500 mt-1">
                Start Date: {formatDate(batch.startDate)}
              </p>
              <p className="text-gray-500">
                End Date: {formatDate(batch.endDate)}
              </p>
              <p className="text-gray-500">Status: {batch.status}</p>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-bold">Description</h4>
              <p className="text-gray-600">{batch.description || 'No description provided'}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" asChild>
              <Link to={`/batches/${batch.batchId}/edit`} className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Edit Batch
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-md border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5" />
              <span>Important Dates</span>
            </CardTitle>
            <CardDescription>Key dates for this batch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-bold">Start Date</h4>
              <p className="text-gray-600">{formatDate(batch.startDate)}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold">End Date</h4>
              <p className="text-gray-600">{formatDate(batch.endDate)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedules" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="schedules" className="gap-2">
            <Calendar className="h-4 w-4" />
            Schedules
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users2 className="h-4 w-4" />
            Students
          </TabsTrigger>
        </TabsList>
        <TabsContent value="schedules" className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                <span>Class Schedules</span>
              </CardTitle>
              <CardDescription>List of scheduled classes for this batch</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium">No schedules found</h3>
                  <p className="text-gray-500 mt-1">No class schedules assigned yet</p>
                  <Button variant="secondary" asChild className="mt-4">
                    <Link to="/schedules/add">
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Add Schedule
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.scheduleId}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="bg-blue-600/10 p-3 rounded-lg">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{schedule.topic}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
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
            <CardFooter>
              <Button variant="secondary" asChild>
                <Link to="/schedules/add">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="students" className="space-y-4">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5" />
                <span>Enrolled Students</span>
              </CardTitle>
              <CardDescription>List of students enrolled in this batch</CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Users2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium">No students enrolled</h3>
                  <p className="text-gray-500 mt-1">No students are currently enrolled in this batch.</p>
                  <Button variant="secondary" asChild className="mt-4">
                    <Link to="/batches/manage-students">
                      <Users2 className="h-4 w-4 mr-2" />
                      Manage Students
                    </Link>
                  </Button>
                </div>
              ) : (
                <ScrollArea className="rounded-md border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
                    {students.map((student) => (
                      <Link key={student.userId} to={`/students/${student.userId}`} className="block">
                        <div className="flex items-center space-x-4 bg-gray-50 rounded-md p-3 hover:bg-gray-100 transition-colors">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.profilePicture?.fileUrl} alt={student.fullName} />
                            <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium leading-none">{student.fullName}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="secondary" asChild>
                <Link to="/batches/manage-students">
                  <Users2 className="h-4 w-4 mr-2" />
                  Manage Students
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
