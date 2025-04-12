
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tab } from '@headlessui/react';
import {
  Calendar,
  Clock,
  Pencil,
  Trash,
  Users,
  GraduationCap,
  Files,
} from 'lucide-react';
import { Batch, Role, User } from '@/lib/types';
import { getBatch, getBatchStudents, deleteBatch } from '@/lib/api';
import { format } from 'date-fns';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import BatchSchedules from '@/components/batches/BatchSchedules';
import BatchResources from '@/components/batches/BatchResources';
import { useAuth } from '@/hooks/use-auth';

const BatchDetail = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      if (!batchId) return;
      
      setLoading(true);
      try {
        const batchResponse = await getBatch(parseInt(batchId));
        
        if (batchResponse.success && batchResponse.data) {
          const batchData = batchResponse.data;
          
          // Check if instructor is authorized for this batch
          if (user?.role === Role.instructor && batchData.instructorId !== user.userId) {
            toast({
              title: 'Access Denied',
              description: 'You are not authorized to view this batch',
              variant: 'destructive',
            });
            navigate('/batches');
            return;
          }
          
          setBatch(batchData);
          
          // Fetch enrolled students
          const studentsResponse = await getBatchStudents(parseInt(batchId));
          if (studentsResponse.success && studentsResponse.data) {
            setStudents(studentsResponse.data);
          }
        } else {
          toast({
            title: 'Error',
            description: batchResponse.error || 'Failed to fetch batch details',
            variant: 'destructive',
          });
          navigate('/batches');
        }
      } catch (error) {
        console.error('Error fetching batch details:', error);
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        navigate('/batches');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBatchDetails();
  }, [batchId, toast, navigate, user]);

  const handleDeleteBatch = async () => {
    if (!batch || !isAdmin) return;
    
    try {
      const response = await deleteBatch(batch.batchId);
      
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
        description: 'An unexpected error occurred while deleting the batch',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">Batch Not Found</h2>
        <p className="text-gray-600 mt-2">The requested batch could not be found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/batches')}>
          Back to Batches
        </Button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  const getBatchStatus = () => {
    const now = new Date();
    const startDate = new Date(batch.startDate);
    const endDate = new Date(batch.endDate);

    if (now < startDate) {
      return {
        label: 'Upcoming',
        class: 'bg-yellow-100 text-yellow-800',
      };
    } else if (now > endDate) {
      return {
        label: 'Completed',
        class: 'bg-gray-100 text-gray-800',
      };
    } else {
      return {
        label: 'In Progress',
        class: 'bg-green-100 text-green-800',
      };
    }
  };

  const status = getBatchStatus();

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: 'Batches', link: '/batches' },
          { label: batch.batchName, link: `/batches/${batch.batchId}` },
        ]}
      />

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{batch.batchName}</h1>
            <span
              className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${status.class}`}
            >
              {status.label}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">
            Course: {batch.course?.courseName || 'Unknown Course'}
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/batches/${batch.batchId}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">{formatDate(batch.startDate)}</div>
                <div className="text-sm text-muted-foreground">to {formatDate(batch.endDate)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Instructor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {batch.instructor?.fullName || 'Unassigned'}
                </div>
                <div className="text-sm text-muted-foreground">Instructor</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">{students.length}</div>
                <div className="text-sm text-muted-foreground">
                  Enrolled Student{students.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 border-b">
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  selected
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`
              }
            >
              Schedules
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  selected
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`
              }
            >
              Resources
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  selected
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`
              }
            >
              Students
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-4">
            <Tab.Panel>
              <BatchSchedules 
                batchId={batch.batchId} 
                isInstructor={user?.role === Role.instructor && batch.instructorId === user.userId}
                isAdmin={isAdmin}
              />
            </Tab.Panel>
            <Tab.Panel>
              <BatchResources 
                batchId={batch.batchId} 
                isInstructor={user?.role === Role.instructor && batch.instructorId === user.userId}
                isAdmin={isAdmin}
              />
            </Tab.Panel>
            <Tab.Panel>
              <div className="space-y-4">
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No students enrolled in this batch yet.</p>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate(`/batches/manage-students?batchId=${batch.batchId}`)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Students
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {isAdmin && (
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/batches/manage-students?batchId=${batch.batchId}`)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Manage Students
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {students.map((student) => (
                        <Card key={student.userId} className="overflow-hidden border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {student.photoUrl ? (
                                  <img
                                    src={student.photoUrl}
                                    alt={student.fullName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Users className="h-6 w-6 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{student.fullName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {student.email}
                                </div>
                                {student.enrollmentDate && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Enrolled: {formatDate(student.enrollmentDate)}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/students/${student.userId}`)}
                              >
                                View
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this batch? This action cannot be undone.
              All schedules and student enrollments for this batch will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBatch}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BatchDetail;
