
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';
import { DataTable } from '@/components/ui/data-table';
import { getUsers, deleteUser } from '@/lib/api';
import { Role, User } from '@/lib/types';
import { Plus, Search, Award, BookOpen, Users, Eye, Edit, Trash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '@/lib/utils';

const Instructors = () => {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
  
  useEffect(() => {
    fetchInstructors();
  }, [toast]);

  const filteredInstructors = instructors.filter((instructor) =>
    instructor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddInstructor = () => {
    navigate('/add-user', { state: { role: Role.instructor } });
  };
  
  const handleDeleteInstructor = async (instructor: User) => {
    try {
      // Confirm before deleting
      const confirmed = window.confirm(`Are you sure you want to delete ${instructor.fullName}?`);
      
      if (!confirmed) {
        return;
      }
      
      console.log(`Deleting instructor with ID: ${instructor.userId}`);
      
      const response = await deleteUser(instructor.userId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete instructor');
      }
      
      // Update the local state
      setInstructors(instructors.filter(i => i.userId !== instructor.userId));
      
      toast({
        title: 'Instructor deleted',
        description: `${instructor.fullName} has been deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting instructor:', error);
      toast({
        title: 'Error deleting instructor',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const instructorColumns = [
    {
      accessorKey: 'fullName' as keyof User,
      header: 'Name',
      cell: (instructor: User) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={instructor.profilePicture?.fileUrl} alt={instructor.fullName} />
            <AvatarFallback>{getInitials(instructor.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{instructor.fullName}</p>
            <p className="text-sm text-muted-foreground">{instructor.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email' as keyof User,
      header: 'Email',
      cell: (instructor: User) => instructor.email,
    },
    {
      accessorKey: 'phoneNumber' as keyof User,
      header: 'Phone',
      cell: (instructor: User) => instructor.phoneNumber || 'N/A',
    },
    {
      accessorKey: 'createdAt' as keyof User,
      header: 'Joined',
      cell: (instructor: User) => {
        const date = new Date(instructor.createdAt);
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date);
      },
    },
    {
      accessorKey: 'courses' as keyof User,
      header: 'Courses',
      cell: () => {
        return Math.floor(Math.random() * 5) + 1;
      },
    },
    {
      accessorKey: 'students' as keyof User,
      header: 'Students',
      cell: () => {
        return Math.floor(Math.random() * 30) + 10;
      },
    },
  ];

  const instructorActions = [
    {
      label: 'View Profile',
      onClick: (instructor: User) => {
        navigate(`/instructors/${instructor.userId}`);
      },
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: 'Edit',
      onClick: (instructor: User) => {
        navigate(`/add-user`, { state: { userId: instructor.userId, role: Role.instructor } });
      },
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: handleDeleteInstructor,
      icon: <Trash className="h-4 w-4" />,
    },
  ];

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold">Instructors</h1>
          <Button onClick={handleAddInstructor}>
            <Plus className="h-4 w-4 mr-2" />
            Add Instructor
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="neo-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{instructors.length}</span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neo-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{instructors.length * 2}</span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neo-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{instructors.length * 15}</span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search instructors..."
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
      </div>
    </Layout>
  );
};

export default Instructors;
