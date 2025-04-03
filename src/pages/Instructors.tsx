import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { getUsers, deleteUser } from '@/lib/api';
import { getCourses } from '@/lib/api/courses';
import { Role, User } from '@/lib/types';
import { Plus, Search, Award, BookOpen, Users, Eye, Edit, Trash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const Instructors = () => {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<User | null>(null);
  const [coursesCount, setCoursesCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const { toast } = useToast();

  const fetchInstructors = async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching instructors...');
      const response = await getUsers(Role.instructor);
      console.log('Response:', response);
      
      if (response.success && response.data) {
        setInstructors(response.data);
      } else {
        console.error('API error:', response.error);
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch instructors',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching instructors',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoursesCount = async () => {
    try {
      const response = await getCourses();
      if (response.success && response.data) {
        setCoursesCount(response.data.length);
      }
    } catch (error) {
      console.error('Error fetching courses count:', error);
    }
  };

  const fetchStudentsCount = async () => {
    try {
      const response = await getUsers(Role.student);
      if (response.success && response.data) {
        setStudentsCount(response.data.length);
      }
    } catch (error) {
      console.error('Error fetching students count:', error);
    }
  };
  
  useEffect(() => {
    fetchInstructors();
    fetchCoursesCount();
    fetchStudentsCount();
  }, []);

  const filteredInstructors = instructors.filter((instructor) =>
    instructor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddInstructor = () => {
    navigate('/add-user', { state: { role: Role.instructor } });
  };
  
  const handleDeleteConfirmation = (instructor: User) => {
    setInstructorToDelete(instructor);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteInstructor = async () => {
    if (!instructorToDelete) return;
    
    try {
      console.log(`Deleting instructor with ID: ${instructorToDelete.userId}`);
      
      const response = await deleteUser(instructorToDelete.userId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete instructor');
      }
      
      // Update the local state
      setInstructors(instructors.filter(i => i.userId !== instructorToDelete.userId));
      
      toast({
        title: 'Instructor deleted',
        description: `${instructorToDelete.fullName} has been deleted successfully`,
      });
      
      setShowDeleteDialog(false);
      setInstructorToDelete(null);
    } catch (error) {
      console.error('Error deleting instructor:', error);
      toast({
        title: 'Error deleting instructor',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleViewInstructor = (instructor: User) => {
    navigate(`/instructors/${instructor.userId}`);
  };

  const handleEditInstructor = (instructor: User) => {
    navigate(`/instructors/${instructor.userId}/edit`);
  };

  const instructorColumns = [
    {
      accessorKey: 'fullName' as keyof User,
      header: 'Name',
      cell: ({ row }: { row: { original: User } }) => (
        <div className="flex items-center gap-3">
          <Link to={`/instructors/${row.original.userId}`}>
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
    {
      accessorKey: 'courses' as keyof User,
      header: 'Courses',
      cell: () => {
        return "N/A"; // This will be improved in a future update
      },
    },
    {
      accessorKey: 'students' as keyof User,
      header: 'Students',
      cell: () => {
        return "N/A"; // This will be improved in a future update
      },
    },
  ];

  const instructorActions = [
    {
      label: 'View Profile',
      onClick: (instructor: User) => handleViewInstructor(instructor),
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: 'Edit',
      onClick: (instructor: User) => handleEditInstructor(instructor),
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: (instructor: User) => handleDeleteConfirmation(instructor),
      icon: <Trash className="h-4 w-4" />,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Instructors</h1>
        <Button onClick={handleAddInstructor} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Instructor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{instructors.length}</span>
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-blue-600" />
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
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{studentsCount}</span>
              <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search instructors..."
            className="pl-10 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading instructors...</p>
          </div>
        ) : (
          <DataTable
            data={filteredInstructors}
            columns={instructorColumns}
            actions={instructorActions}
            className="w-full"
            searchKey="fullName"
          />
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instructor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this instructor? This action cannot be undone.
              The instructor will be removed from all assigned batches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInstructor}
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

export default Instructors;
