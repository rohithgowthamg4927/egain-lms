
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getBatch, enrollStudentInBatch, getBatchStudents } from '@/lib/api/batches';
import { getUsers } from '@/lib/api/users';
import { User, Role } from '@/lib/types';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

const ManageStudents = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchId = searchParams.get('batchId');
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [batch, setBatch] = useState<any>(null);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!batchId) {
        toast({
          title: 'Error',
          description: 'Batch ID is missing',
          variant: 'destructive',
        });
        navigate('/batches');
        return;
      }

      setIsLoading(true);
      try {
        // Fetch batch details
        const batchResponse = await getBatch(parseInt(batchId));
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

        // Fetch enrolled students
        const enrolledStudentsResponse = await getBatchStudents(parseInt(batchId));
        const enrolledStudentsList = enrolledStudentsResponse.success && enrolledStudentsResponse.data
          ? (Array.isArray(enrolledStudentsResponse.data) ? enrolledStudentsResponse.data : [enrolledStudentsResponse.data])
          : [];
        
        setEnrolledStudents(enrolledStudentsList);

        // Fetch all students
        const allStudentsResponse = await getUsers(Role.student);
        if (allStudentsResponse.success && allStudentsResponse.data) {
          const allStudents = Array.isArray(allStudentsResponse.data) 
            ? allStudentsResponse.data 
            : [allStudentsResponse.data];
          
          const enrolledIds = enrolledStudentsList.map((student: User) => student.userId);
          
          // Filter out already enrolled students
          const notEnrolledStudents = allStudents.filter(
            (student) => !enrolledIds.includes(student.userId)
          );
          
          setAvailableStudents(notEnrolledStudents);
        } else {
          toast({
            title: 'Error',
            description: allStudentsResponse.error || 'Failed to fetch students',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [batchId, navigate, toast]);

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleEnrollStudents = async () => {
    if (!batchId || selectedStudents.length === 0) {
      toast({
        title: 'No students selected',
        description: 'Please select at least one student to enroll',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const enrollmentPromises = selectedStudents.map(studentId => 
        enrollStudentInBatch(studentId, parseInt(batchId))
      );
      
      const results = await Promise.all(enrollmentPromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      if (successCount > 0) {
        toast({
          title: 'Students enrolled',
          description: `Successfully enrolled ${successCount} student${successCount !== 1 ? 's' : ''} to the batch.${failCount > 0 ? ` ${failCount} enrollment${failCount !== 1 ? 's' : ''} failed.` : ''}`,
        });
        
        navigate(`/batches/${batchId}`);
      } else {
        toast({
          title: 'Enrollment failed',
          description: 'Failed to enroll any students to the batch',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to enroll students',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = availableStudents.filter(student => 
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const breadcrumbItems = batch ? [
    { label: 'Batches', link: '/batches' },
    { label: batch.batchName, link: `/batches/${batchId}` },
    { label: 'Manage Students', link: `/batches/manage-students?batchId=${batchId}` },
  ] : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-0">
      <div className="flex flex-col gap-2 mb-6">
        <BreadcrumbNav items={breadcrumbItems} />
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/batches/${batchId}`)}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Batch
          </Button>
          <h1 className="text-3xl font-bold">Manage Students</h1>
        </div>
        <p className="text-muted-foreground">
          {batch ? `Enroll students to the batch: ${batch.batchName}` : 'Loading...'}
        </p>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-6">
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="searchStudents">Search Students</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="searchStudents"
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <ScrollArea className="h-[400px] border rounded-md p-4">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No students match your search' : 'No available students to enroll'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.userId} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`student-${student.userId}`} 
                    checked={selectedStudents.includes(student.userId)}
                    onCheckedChange={() => toggleStudentSelection(student.userId)}
                  />
                  <Label 
                    htmlFor={`student-${student.userId}`}
                    className="flex flex-1 items-center justify-between cursor-pointer p-2 hover:bg-gray-100 rounded"
                  >
                    <div className="font-medium">{student.fullName}</div>
                    <span className="text-sm text-gray-500">{student.email}</span>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="mt-6 flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/batches/${batchId}`)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEnrollStudents}
            disabled={selectedStudents.length === 0 || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              'Enrolling Students...'
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll Selected Students ({selectedStudents.length})
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;
