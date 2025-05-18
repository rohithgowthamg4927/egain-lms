import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { getUsers, deleteUser } from '@/lib/api';
import { getCourses } from '@/lib/api/courses';
import { getBatches } from '@/lib/api/batches';
import { User, Role, StudentCourse } from '@/lib/types';
import { Plus, Search, GraduationCap, BookOpen, Calendar, Eye, Edit, Trash, FileText, X, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SORT_OPTIONS = [
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' },
  { value: 'recent', label: 'Recently Joined' },
  { value: 'oldest', label: 'First Joined' },
];

const Students = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  const [studentCourses, setStudentCourses] = useState<Record<number, StudentCourse[]>>({});
  const [coursesCount, setCoursesCount] = useState(0);
  const [batchesCount, setBatchesCount] = useState(0);
  const [sortOption, setSortOption] = useState('az');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [batches, setBatches] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    
    try {
      const response = await getUsers(Role.student);
      
      if (response.success && response.data) {
        const studentsData = Array.isArray(response.data) ? response.data : [response.data];
        setStudents(studentsData);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch students',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching students',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentCoursesData = async () => {
    try {
      const coursesResponse = await getCourses();
      if (coursesResponse.success && coursesResponse.data) {
        const coursesData = Array.isArray(coursesResponse.data) ? coursesResponse.data : [coursesResponse.data];
        setCoursesCount(coursesData.length);
      }

      const batchesResponse = await getBatches();
      if (batchesResponse.success && batchesResponse.data) {
        const batchesData = Array.isArray(batchesResponse.data) ? batchesResponse.data : [batchesResponse.data];
        setBatchesCount(batchesData.length);
        setBatches(batchesData);
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchStudentCoursesData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = students.filter(student => 
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, students]);

  const handleSuggestionClick = (student: User) => {
    setSearchTerm(student.fullName);
    setShowSuggestions(false);
    navigate(`/students/${student.userId}`);
  };

  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesBatch = true;
      if (selectedBatch !== 'all') {
        const batch = batches.find((b) => b.batchId.toString() === selectedBatch);
        matchesBatch = batch && Array.isArray(batch.students)
          ? batch.students.some((sb: any) => sb.studentId === student.userId)
          : false;
      }
      return matchesSearch && matchesBatch;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'az':
          return a.fullName.localeCompare(b.fullName);
        case 'za':
          return b.fullName.localeCompare(a.fullName);
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  const handleAddStudent = () => {
    navigate('/add-user', { state: { role: Role.student } });
  };

  const handleDeleteConfirmation = (student: User) => {
    setStudentToDelete(student);
    setShowDeleteDialog(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      const response = await deleteUser(studentToDelete.userId);
      
      if (response.success) {
        setStudents(students.filter(s => s.userId !== studentToDelete.userId));
        toast({
          title: 'Student deleted',
          description: `${studentToDelete.fullName} has been removed`,
        });
      } else {
        throw new Error(response.error || 'Failed to delete student');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteDialog(false);
      setStudentToDelete(null);
    }
  };

  const handleViewStudent = (student: User) => {
    navigate(`/students/${student.userId}`);
  };

  const handleEditStudent = (student: User) => {
    navigate(`/students/${student.userId}/edit`);
  };

  const studentColumns = [
    {
      accessorKey: 'fullName' as keyof User,
      header: 'Name',
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex items-center gap-3">
          <Link to={`/students/${row.original.userId}`}>
            <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
              <AvatarImage src={row.original.profilePicture?.fileUrl} alt={row.original.fullName} />
              <AvatarFallback>{getInitials(row.original.fullName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <p className="font-medium">{row.original.fullName}</p>
            <p className="text-sm text-gray-500">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email' as keyof User,
      header: 'Email',
      cell: ({ row }: { row: { original: User } }) => row.original.email,
    },
    {
      accessorKey: 'phoneNumber' as keyof User,
      header: 'Phone',
      cell: ({ row }: { row: { original: User } }) => row.original.phoneNumber || 'N/A',
    },
    {
      accessorKey: 'createdAt' as keyof User,
      header: 'Joined',
      cell: ({ row }: { row: { original: User } }) => {
        return formatDate(row.original.createdAt);
      },
    },
  ];

  const studentActions = [
    {
      label: 'View Profile',
      onClick: (student: User) => handleViewStudent(student),
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: 'Edit',
      onClick: (student: User) => handleEditStudent(student),
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: (student: User) => handleDeleteConfirmation(student),
      icon: <Trash className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Students', link: '/students' }
      ]} />
      <div className="animate-fade-in space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Students</h1>
          <Button onClick={handleAddStudent} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="shadow-md border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{students.length}</span>
                <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{coursesCount}</span>
                <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{batchesCount}</span>
                <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
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
                placeholder="Search students..."
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
                  {suggestions.map((student) => (
                    <div
                      key={student.userId}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                      onClick={() => handleSuggestionClick(student)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSuggestionClick(student);
                        }
                      }}
                    >
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="font-medium">{student.fullName}</div>
                        <div className="text-sm text-gray-500">
                          {student.email}
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
            {/* Batch Dropdown */}
            <div className="w-full md:w-56">
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger className="w-full border-gray-200">
                  <SelectValue placeholder="All Batches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches.map((batch) => (
                    <SelectItem key={batch.batchId} value={batch.batchId.toString()}>
                      {batch.batchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading students...</p>
            </div>
          ) : (
            <DataTable
              data={filteredStudents}
              columns={studentColumns}
              actions={studentActions}
              className="w-full"
              searchKey="fullName"
            />
          )}
        </div>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this student? This action cannot be undone.
                The following data will be permanently deleted:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>All attendance records for this student</li>
                  <li>All batch enrollments</li>
                  <li>All course enrollments</li>
                  <li>Student profile and associated data</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteStudent}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Students;
