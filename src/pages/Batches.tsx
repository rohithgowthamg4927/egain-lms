
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BatchGrid from '@/components/batches/BatchGrid';
import { 
  getBatches, 
  getCourses, 
  getUsers, 
  deleteBatch,
} from '@/lib/api';
import { Batch, Course, User, Role } from '@/lib/types';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Clock, 
  UserIcon
} from 'lucide-react';
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

const Batches = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Check for URL params for actions
  useEffect(() => {
    const action = searchParams.get('action');
    const batchId = searchParams.get('batchId');
    
    if (action && batchId) {
      switch (action) {
        case 'edit':
          navigate(`/batches/${batchId}/edit`);
          break;
        case 'manageStudents':
          navigate(`/batches/manage-students?batchId=${batchId}`);
          break;
      }
    }
  }, [searchParams, navigate]);

  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      const batchesResponse = await getBatches();
      if (batchesResponse.success && batchesResponse.data) {
        setBatches(batchesResponse.data);
      } else {
        toast({
          title: 'Error',
          description: batchesResponse.error || 'Failed to fetch batches',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch batches',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const [batchesResponse, coursesResponse] = await Promise.all([
          getBatches(),
          getCourses(),
        ]);
        
        if (batchesResponse.success && batchesResponse.data) {
          setBatches(batchesResponse.data);
        } else {
          toast({
            title: 'Error',
            description: batchesResponse.error || 'Failed to fetch batches',
            variant: 'destructive',
          });
        }
        
        if (coursesResponse.success && coursesResponse.data) {
          setCourses(coursesResponse.data);
        } else {
          toast({
            title: 'Error',
            description: coursesResponse.error || 'Failed to fetch courses',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
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
  }, [toast]);

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = batch.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.course?.courseName && batch.course.courseName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCourse = selectedCourse === 'all' || 
      batch.courseId.toString() === selectedCourse;
    
    return matchesSearch && matchesCourse;
  });

  const handleViewBatch = (batch: Batch) => {
    navigate(`/batches/${batch.batchId}`);
  };

  const handleEditBatch = (batch: Batch) => {
    navigate(`/batches/${batch.batchId}/edit`);
  };

  const handleDeleteConfirmation = (batch: Batch) => {
    setBatchToDelete(batch);
    setShowDeleteDialog(true);
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    
    try {
      const response = await deleteBatch(batchToDelete.batchId);
      
      if (response.success) {
        toast({
          title: 'Batch deleted',
          description: `Batch "${batchToDelete.batchName}" has been deleted successfully.`,
        });
        
        // Refresh the batches list
        fetchBatches();
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
        description: 'Failed to delete batch',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setBatchToDelete(null);
    }
  };

  const handleManageStudents = (batch: Batch) => {
    navigate(`/batches/manage-students?batchId=${batch.batchId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Batches</h1>
        <Button onClick={() => navigate('/batches/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Batch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{batches.length}</span>
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {batches.reduce((total, batch) => {
                  // Check if students is an array before using length
                  if (Array.isArray(batch.students)) {
                    return total + batch.students.length;
                  }
                  // If it's a count property (studentsCount)
                  else if (typeof batch.studentsCount === 'number') {
                    return total + batch.studentsCount;
                  }
                  return total;
                }, 0)}
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {batches.filter(batch => new Date(batch.startDate) > new Date()).length}
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search batches..."
              className="pl-10 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Select
              value={selectedCourse}
              onValueChange={setSelectedCourse}
            >
              <SelectTrigger className="w-[180px] border-gray-200">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.courseId} value={course.courseId.toString()}>
                    {course.courseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <BatchGrid
        batches={filteredBatches}
        loading={isLoading}
        onView={handleViewBatch}
        onEdit={handleEditBatch}
        onDelete={handleDeleteConfirmation}
        onManageStudents={handleManageStudents}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this batch? This action cannot be undone.
              All enrolled students will be unenrolled from this batch.
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

export default Batches;
