
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { DataTable } from '@/components/ui/data-table';
import { getUsers } from '@/lib/api';
import { Role, User } from '@/lib/types';
import { Plus, Search, UserPlus, UserCog, UserCheck, Eye, Edit, Trash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Students = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const response = await getUsers(Role.STUDENT);
        
        if (response.success && response.data) {
          setStudents(response.data);
        } else {
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
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredStudents = students.filter((student) =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = () => {
    toast({
      title: 'Add Student',
      description: 'This feature is not implemented in the demo.',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const studentColumns = [
    {
      accessorKey: 'fullName' as keyof User,
      header: 'Name',
      cell: (student: User) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={student.photoUrl} alt={student.fullName} />
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
      cell: () => null, // Hidden since we're showing it in the name cell
    },
    {
      accessorKey: 'role' as keyof User,
      header: 'Role',
      cell: (student: User) => (
        <Badge variant="outline" className="font-normal bg-primary/10 text-primary hover:bg-primary/20">
          Student
        </Badge>
      ),
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
        // For demo purposes, just showing random numbers
        return Math.floor(Math.random() * 5);
      },
    },
    {
      accessorKey: 'status' as keyof User,
      header: 'Status',
      cell: () => {
        const statuses = ['Active', 'Inactive'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        return (
          <Badge variant="outline" className={`font-normal ${
            randomStatus === 'Active' 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}>
            {randomStatus}
          </Badge>
        );
      },
    },
  ];

  const studentActions = [
    {
      label: 'View Profile',
      onClick: (student: User) => {
        window.location.href = `/students/${student.id}`;
      },
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: 'Edit',
      onClick: (student: User) => {
        toast({
          title: 'Edit Student',
          description: `Editing: ${student.fullName}`,
        });
      },
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: (student: User) => {
        toast({
          title: 'Delete Student',
          description: `Are you sure you want to delete ${student.fullName}?`,
          variant: 'destructive',
        });
      },
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
          <DataTable
            data={filteredStudents}
            columns={studentColumns}
            actions={studentActions}
            className="w-full"
            searchKey="fullName"
          />
        </div>
      </div>
    </Layout>
  );
};

export default Students;
