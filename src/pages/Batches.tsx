
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
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
import Layout from '@/components/layout/Layout';
import { DataTable } from '@/components/ui/data-table';
import { getBatches, getCourses, getUsers, createBatch } from '@/lib/api';
import { Batch, Course, User, Role } from '@/lib/types';
import { Plus, Search, Calendar, Users, Eye, Edit, Trash, User as UserIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const Batches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states for creating a new batch
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchCourse, setNewBatchCourse] = useState('');
  const [newBatchInstructor, setNewBatchInstructor] = useState('');
  const [newBatchStartDate, setNewBatchStartDate] = useState('');
  const [newBatchEndDate, setNewBatchEndDate] = useState('');

  const fetchBatches = async () => {
    try {
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
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch batches, courses, and instructors
        const [batchesResponse, coursesResponse, instructorsResponse] = await Promise.all([
          getBatches(),
          getCourses(),
          getUsers(Role.instructor),
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

        if (instructorsResponse.success && instructorsResponse.data) {
          setInstructors(instructorsResponse.data);
        } else {
          toast({
            title: 'Error',
            description: instructorsResponse.error || 'Failed to fetch instructors',
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

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = batch.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.course?.courseName && batch.course.courseName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCourse = selectedCourse === 'all' || 
      batch.courseId.toString() === selectedCourse;
    
    return matchesSearch && matchesCourse;
  });

  const handleCreateBatch = async () => {
    if (!newBatchName || !newBatchCourse || !newBatchInstructor || !newBatchStartDate || !newBatchEndDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the actual batch in the database
      const response = await createBatch({
        batchName: newBatchName,
        courseId: parseInt(newBatchCourse),
        instructorId: parseInt(newBatchInstructor),
        startDate: new Date(newBatchStartDate).toISOString(),
        endDate: new Date(newBatchEndDate).toISOString(),
      });
      
      if (response.success && response.data) {
        toast({
          title: 'Batch created',
          description: `Batch "${newBatchName}" has been created successfully.`,
        });
        
        // Reset form fields
        setNewBatchName('');
        setNewBatchCourse('');
        setNewBatchInstructor('');
        setNewBatchStartDate('');
        setNewBatchEndDate('');
        
        // Close the dialog
        setIsCreateDialogOpen(false);
        
        // Refresh the batches list
        fetchBatches();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create batch',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to create batch',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const batchColumns = [
    {
      accessorKey: 'batchName' as keyof Batch,
      header: 'Batch Name',
    },
    {
      accessorKey: 'course' as keyof Batch,
      header: 'Course',
      cell: (batch: Batch) => batch.course?.courseName || 'N/A',
    },
    {
      accessorKey: 'instructor' as keyof Batch,
      header: 'Instructor',
      cell: (batch: Batch) => batch.instructor?.fullName || 'N/A',
    },
    {
      accessorKey: 'startDate' as keyof Batch,
      header: 'Start Date',
      cell: (batch: Batch) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          {format(new Date(batch.startDate), 'MMM d, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'endDate' as keyof Batch,
      header: 'End Date',
      cell: (batch: Batch) => format(new Date(batch.endDate), 'MMM d, yyyy'),
    },
    {
      accessorKey: 'studentsCount' as keyof Batch,
      header: 'Students',
      cell: (batch: Batch) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
          {batch.studentsCount || 0}
        </div>
      ),
    },
  ];

  const batchActions = [
    {
      label: 'View',
      onClick: (batch: Batch) => {
        window.location.href = `/batches/${batch.batchId}`;
      },
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: 'Edit',
      onClick: (batch: Batch) => {
        toast({
          title: 'Edit Batch',
          description: `Editing: ${batch.batchName}`,
        });
      },
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: (batch: Batch) => {
        toast({
          title: 'Delete Batch',
          description: `Are you sure you want to delete ${batch.batchName}?`,
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
          <h1 className="text-3xl font-bold">Batches</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
                <DialogDescription>
                  Enter the details for the new batch.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="batchName">Batch Name</Label>
                  <Input
                    id="batchName"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    placeholder="Enter batch name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="batchCourse">Course</Label>
                  <Select value={newBatchCourse} onValueChange={setNewBatchCourse}>
                    <SelectTrigger id="batchCourse">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.courseId} value={course.courseId.toString()}>
                          {course.courseName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="batchInstructor">Instructor</Label>
                  <Select value={newBatchInstructor} onValueChange={setNewBatchInstructor}>
                    <SelectTrigger id="batchInstructor">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((instructor) => (
                        <SelectItem key={instructor.userId} value={instructor.userId.toString()}>
                          {instructor.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="batchStartDate">Start Date</Label>
                  <Input
                    id="batchStartDate"
                    type="date"
                    value={newBatchStartDate}
                    onChange={(e) => setNewBatchStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="batchEndDate">End Date</Label>
                  <Input
                    id="batchEndDate"
                    type="date"
                    value={newBatchEndDate}
                    onChange={(e) => setNewBatchEndDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateBatch} 
                  disabled={isSubmitting || !newBatchName || !newBatchCourse || !newBatchInstructor || !newBatchStartDate || !newBatchEndDate}
                >
                  {isSubmitting ? 'Creating...' : 'Create Batch'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="neo-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{batches.length}</span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
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
                <span className="text-3xl font-bold">
                  {batches.reduce((total, batch) => total + (batch.studentsCount || 0), 0)}
                </span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="neo-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {batches.filter(batch => new Date(batch.startDate) > new Date()).length}
                </span>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Select
                value={selectedCourse}
                onValueChange={setSelectedCourse}
              >
                <SelectTrigger className="w-[180px]">
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

        <div className="bg-card rounded-lg border overflow-hidden">
          <DataTable
            data={filteredBatches}
            columns={batchColumns}
            actions={batchActions}
            className="w-full"
            searchKey="batchName"
          />
        </div>
      </div>
    </Layout>
  );
};

export default Batches;
