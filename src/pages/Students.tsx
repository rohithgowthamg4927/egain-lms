import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { DataTable } from '@/components/ui/data-table';
import { getUsers, deleteUser } from '@/lib/api';
import { Role, User } from '@/lib/types';
import { Plus, Search, UserPlus, UserCog, UserCheck, Eye, Edit, Trash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '@/lib/utils';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
  
  useEffect(() => {
    fetchStudents();
  }, [toast]);

  const filteredStudents = students.filter((student) =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = () => {
    navigate('/add-user', { state: { role: Role.student } });
  };
  
  const handleViewStudent = (student: User) => {
    console.log(`Navigating to student profile with ID: ${student.userId}`);
    navigate(`/students/${student.userId}`);
  };

  const handleEditStudent = (student: User) => {
    console.log(`Navigating to edit student with ID: ${student.userId}`);
    navigate(`/add-user`, { state: { userId: student.userId, role: Role.student } });
  };
  
  const handleDeleteStudent = async (student: User) => {
    try {
      const confirmed = window.confirm(`Are you sure you want to delete ${student.fullName}?`);
      
      if (!confirmed) {
        return;
      }
      
      console.log(`Deleting student with ID: ${student.userId}`);
      
      const response = await deleteUser(student.userId);
      
      if (!response.success) {
        console.error('Delete student API error:', response.error);
        throw new Error(response.error || 'Failed to delete student');
      }
      
      setStudents(students.filter(s => s.userId !== student.userId));
      
      toast({
        title: 'Student deleted',
        description: `${student.fullName} has been deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Error deleting student',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const studentColumns = [
    {
      accessorKey: 'fullName' as keyof User,
      header: 'Name',
      cell: (student: User) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={student.profilePicture?.fileUrl} alt={student.fullName} />
            <AvatarFallback>{getInitials(student.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{student.fullName}</p>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email' as keyof User,
      header: 'Email',
      cell: (student: User) => student.email,
    },
    {
      accessorKey: 'phoneNumber' as keyof User,
      header: 'Phone',
      cell: (student: User) => student.phoneNumber || 'N/A',
    },
    {
      accessorKey: 'createdAt' as keyof User,
      header: 'Joined',
      cell: (student: User) => {
        const date = new Date(student.createdAt);
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date);
      },
    },
    {
      accessorKey: 'courses' as keyof User,
      header: 'Enrolled Courses',
      cell: () => {
        return Math.floor(Math.random() * 5);
      },
    }
  ];

  const studentActions = [
    {
      label: 'View Profile',
      onClick: handleViewStudent,
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: 'Edit',
      onClick: handleEditStudent,
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: handleDeleteStudent,
      icon: <Trash className="h-4 w-4" />,
    },
  ];

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold">Students</h1>
          <Button onClick={handleAddStudent}>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="neo-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{students.length}</span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neo-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{Math.floor(students.length * 0.8)}</span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neo-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">New Students (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{Math.floor(students.length * 0.3)}</span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCog className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-card rounded-lg border overflow-hidden">
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
      </div>
    </Layout>
  );
};

export default Students;
