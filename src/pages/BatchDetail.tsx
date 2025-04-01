
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { getBatchById, getBatchStudents, unenrollStudentFromBatch } from '@/lib/api';
import { Batch, User } from '@/lib/types';
import { ArrowLeft, Calendar, Clock, Edit, Trash, User as UserIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { getCourseName, getInstructorName } from '@/lib/utils/entity-helpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const BatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmRemoveStudent, setConfirmRemoveStudent] = useState<User | null>(null);

  useEffect(() => {
    const fetchBatchData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const batchId = parseInt(id);
        
        const [batchResponse, studentsResponse] = await Promise.all([
          getBatchById(batchId),
          getBatchStudents(batchId)
        ]);
        
        if (batchResponse.success && batchResponse.data) {
          setBatch(batchResponse.data);
        } else {
          toast({
            title: 'Error',
            description: batchResponse.error || 'Failed to fetch batch details',
            variant: 'destructive',
          });
        }
        
        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data);
        } else {
          toast({
            title: 'Error',
            description: studentsResponse.error || 'Failed to fetch enrolled students',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching batch details:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch batch details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBatchData();
  }, [id]);

  const handleEditBatch = () => {
    if (batch) {
      navigate(`/batches/edit/${batch.batchId}`);
    }
  };

  const handleRemoveStudent = async () => {
    if (!batch || !confirmRemoveStudent) return;
    
    try {
      const response = await unenrollStudentFromBatch(confirmRemoveStudent.userId, batch.batchId);
      
      if (response.success) {
        toast({
          title: 'Student removed',
          description: `${confirmRemoveStudent.fullName} has been removed from the batch.`,
        });
        
        setStudents(prev => prev.filter(s => s.userId !== confirmRemoveStudent.userId));
        setConfirmRemoveStudent(null);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to remove student from the batch',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove student from the batch',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-40 bg-muted rounded"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
          <div className="h-60 bg-muted rounded"></div>
        </div>
      </Layout>
    );
  }

  if (!batch) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Batch not found</h2>
          <p className="text-muted-foreground mt-2">The batch you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/batches')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Batches
          </Button>
        </div>
      </Layout>
    );
  }

  const startDate = new Date(batch.startDate);
  const endDate = new Date(batch.endDate);
  
  const studentColumns = [
    {
      accessorKey: 'fullName' as keyof User,
      header: 'Name',
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.fullName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email' as keyof User,
      header: 'Email',
    },
    {
      accessorKey: 'enrollmentDate' as keyof (User & { enrollmentDate?: string }),
      header: 'Enrolled On',
      cell: ({ row }: { row: { original: User & { enrollmentDate?: string } } }) => {
        return row.original.enrollmentDate 
          ? format(new Date(row.original.enrollmentDate), 'MMM d, yyyy') 
          : 'N/A';
      },
    },
  ];

  const studentActions = [
    {
      label: 'Remove from Batch',
      onClick: (student: User) => {
        setConfirmRemoveStudent(student);
      },
      icon: <Trash className="h-4 w-4" />,
    }
  ];

  return (
    <Layout noHeader={true}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Button 
              variant="ghost" 
              className="flex items-center mb-2 -ml-4" 
              onClick={() => navigate('/batches')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Batches
            </Button>
            <h2 className="text-3xl font-bold">{batch.batchName}</h2>
            <p className="text-muted-foreground">
              {getCourseName(batch.course, batch.courseId)}
            </p>
          </div>
          <Button onClick={handleEditBatch}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Batch
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Instructor:</span>
                <span className="font-medium">{getInstructorName(batch.instructor, batch.instructorId)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Start Date:</span>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(startDate, 'MMMM d, yyyy')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">End Date:</span>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(endDate, 'MMMM d, yyyy')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Duration:</span>
                <span>
                  {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Created On:</span>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{format(new Date(batch.createdAt), 'MMMM d, yyyy')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Enrolled Students:</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{students.length}</span>
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge 
                  variant={
                    new Date() < startDate ? "outline" : 
                    new Date() > endDate ? "secondary" : 
                    "default"
                  }
                >
                  {
                    new Date() < startDate ? "Upcoming" : 
                    new Date() > endDate ? "Completed" : 
                    "In Progress"
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="students" className="w-full">
          <TabsList>
            <TabsTrigger value="students">Enrolled Students</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          <TabsContent value="students" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>
                  {students.length === 0 
                    ? "No students enrolled in this batch yet."
                    : `${students.length} student${students.length !== 1 ? 's' : ''} enrolled in this batch.`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <DataTable
                    data={students}
                    columns={studentColumns}
                    actions={studentActions}
                    pagination={students.length > 10}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="schedule" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>
                  Schedule for this batch will be shown here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Schedule management will be implemented in the next phase.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!confirmRemoveStudent} onOpenChange={(open) => !open && setConfirmRemoveStudent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Student from Batch</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {confirmRemoveStudent?.fullName} from this batch?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmRemoveStudent(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveStudent}>
                Remove Student
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default BatchDetail;
