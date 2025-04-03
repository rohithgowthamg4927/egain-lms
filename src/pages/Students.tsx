
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { getUsers, deleteUser } from '@/lib/api';
import { getCourses } from '@/lib/api/courses';
import { getDashboardCounts } from '@/lib/api/dashboard';
import { Role, User } from '@/lib/types';
import { Plus, Search, GraduationCap, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate, Link } from 'react-router-dom';
import { getInitials } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date-helpers';
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

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentToDelete, setStudentToDelete] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [coursesCount, setCoursesCount] = useState(0);
  const { toast } = useToast();

  const fetchStudents = async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching students...');
      const response = await getUsers(Role.student);
      console.log('Response:', response);
      
      if (response.success && response.data) {
        setStudents(response.data);
      } else {
        console.error('API error:', response.error);
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch students',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching students',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchCoursesCount = async () => {
    try {
      // Use dashboard counts endpoint to get course count
      const response = await getDashboardCounts();
      if (response.success && response.data) {
        setCoursesCount(response.data.coursesCount);
      } else {
        // Fallback to courses endpoint if dashboard counts fails
        const coursesResponse = await getCourses();
        if (coursesResponse.success && coursesResponse.data) {
          setCoursesCount(coursesResponse.data.length);
        }
      }
    } catch (error) {
      console.error('Error fetching courses count:', error);
    }
  };
  
  useEffect(() => {
    fetchStudents();
    fetchCoursesCount();
  }, [toast]);

  const filteredStudents = students.filter((student) =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      console.log(`Deleting student with ID: ${studentToDelete.userId}`);
      
      const response = await deleteUser(studentToDelete.userId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete student');
      }
      
      // Update the local state
      setStudents(students.filter(s => s.userId !== studentToDelete.userId));
      
      toast({
        title: 'Student deleted',
        description: `${studentToDelete.fullName} has been deleted successfully`,
      });
      
      setShowDeleteDialog(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Error deleting student',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleViewStudent = (student: User) => {
    console.log("Navigating to student profile:", student.userId);
    navigate(`/students/${student.userId}`);
  };
  
  const handleEditStudent = (student: User) => {
    navigate(`/add-user`, { state: { userId: student.userId, role: Role.student } });
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
            <p className="text-sm text-muted-foreground">{row.original.email}</p>
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
    {
      accessorKey: 'courses' as keyof User,
      header: 'Courses',
      cell: () => {
        return "N/A"; // This will be improved in a future update
      },
    },
  ];

  const studentActions = [
    {
      label: 'View Profile',
      onClick: handleViewStudent, // Make sure this is correctly bound
      icon: 'eye',
    },
    {
      label: 'Edit',
      onClick: handleEditStudent,
      icon: 'edit',
    },
    {
      label: 'Delete',
      onClick: handleDeleteConfirmation,
      icon: 'trash',
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Students</h1>
        <Button onClick={handleAddStudent} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
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
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search students..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
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
              The student will be removed from all batches and courses.
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
  );
};

export default Students;
