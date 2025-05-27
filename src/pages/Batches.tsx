import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import BatchList from '@/components/batches/BatchList';
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
  UserIcon,
  LayoutGrid,
  List,
  X
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
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { useAuth } from '@/hooks/use-auth';

const SORT_OPTIONS = [
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'oldest', label: 'First Added' },
];
const STATUS_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'upcoming', label: 'Upcoming' },
];

const Batches = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  const isInstructor = user?.role === Role.instructor;
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sortOption, setSortOption] = useState('az');
  const [selectedInstructor, setSelectedInstructor] = useState('all');
  const [instructors, setInstructors] = useState<User[]>([]);
  const [status, setStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Batch[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

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
        const [batchesResponse, coursesResponse, instructorsResponse] = await Promise.all([
          getBatches(),
          getCourses(),
          isAdmin ? getUsers(Role.instructor) : Promise.resolve({ success: true, data: [] })
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
        if (isAdmin && instructorsResponse.success && instructorsResponse.data) {
          setInstructors(instructorsResponse.data as User[]);
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
  }, [toast, isAdmin]);

  // Filtering and sorting logic
  const filteredBatches = batches
    .filter((batch) => {
      if (isInstructor && batch.instructorId !== user?.userId) return false;
    const matchesSearch = batch.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.course?.courseName && batch.course.courseName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCourse = selectedCourse === 'all' || batch.courseId.toString() === selectedCourse;
      const matchesInstructor = selectedInstructor === 'all' || batch.instructorId?.toString() === selectedInstructor;
      const now = new Date();
      let matchesStatus = true;
      if (status === 'active') {
        matchesStatus = new Date(batch.endDate) >= now;
      } else if (status === 'completed') {
        matchesStatus = new Date(batch.endDate) < now;
      } else if (status === 'upcoming') {
        matchesStatus = new Date(batch.startDate) > now;
      }
      return matchesSearch && matchesCourse && matchesInstructor && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'az':
          return a.batchName.localeCompare(b.batchName);
        case 'za':
          return b.batchName.localeCompare(a.batchName);
        case 'recent':
          return b.batchId - a.batchId;
        case 'oldest':
          return a.batchId - b.batchId;
        default:
          return 0;
      }
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
        
        fetchBatches();
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

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions when search term changes
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = batches.filter(batch => 
        batch.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (batch.course?.courseName && batch.course.courseName.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, batches]);

  const handleSuggestionClick = (batch: Batch) => {
    setSearchTerm(batch.batchName);
    setShowSuggestions(false);
    navigate(`/batches/${batch.batchId}`);
  };

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Batches', link: '/batches' }
      ]} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Batches</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        {isAdmin && (
          <Button onClick={() => navigate('/batches/add')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Batch
          </Button>
        )}
        </div>
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
                  if (Array.isArray(batch.students)) {
                    return total + batch.students.length;
                  }
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
          <div className="flex-1 relative" ref={searchRef}>
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search batches..."
              className="pl-10 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setSearchTerm('');
                  setShowSuggestions(false);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                {suggestions.map((batch) => (
                  <div
                    key={batch.batchId}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => handleSuggestionClick(batch)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSuggestionClick(batch);
                      }
                    }}
                  >
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium">{batch.batchName}</div>
                      <div className="text-sm text-gray-500">
                        {batch.course?.courseName || 'No course assigned'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Sorting Dropdown */}
          <div className="w-full md:w-48">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full border-gray-200">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Course, Instructor, Status Dropdowns */}
          <div className="flex items-center gap-2">
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
            {isAdmin && (
              <Select
                value={selectedInstructor}
                onValueChange={setSelectedInstructor}
              >
                <SelectTrigger className="w-[180px] border-gray-200">
                  <SelectValue placeholder="All Instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instructors</SelectItem>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.userId} value={instructor.userId.toString()}>
                      {instructor.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger className="w-[150px] border-gray-200">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
      <BatchGrid
        batches={filteredBatches}
        loading={isLoading}
        onView={handleViewBatch}
        onEdit={handleEditBatch}
        onDelete={handleDeleteConfirmation}
        onManageStudents={handleManageStudents}
        onInstructorClick={(instructorId) => navigate(`/instructors/${instructorId}`)}
      />
      ) : (
        <BatchList
          batches={filteredBatches}
          loading={isLoading}
          onView={handleViewBatch}
          onEdit={handleEditBatch}
          onDelete={handleDeleteConfirmation}
          onManageStudents={handleManageStudents}
          onInstructorClick={(instructorId) => navigate(`/instructors/${instructorId}`)}
        />
      )}

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
