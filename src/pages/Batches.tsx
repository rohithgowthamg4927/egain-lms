
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Layout from '@/components/layout/Layout';
import { DataTable } from '@/components/ui/data-table';
import { getBatches, getCourses, getUsers, createBatch, updateBatch, deleteBatch } from '@/lib/api';
import { Batch, Course, User, Role, Level } from '@/lib/types';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Users, 
  Eye, 
  Edit, 
  Trash, 
  User as UserIcon, 
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const Batches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  
  // Form states for creating/editing a batch
  const [batchName, setBatchName] = useState('');
  const [batchCourse, setBatchCourse] = useState('');
  const [batchInstructor, setBatchInstructor] = useState('');
  const [batchStartDate, setBatchStartDate] = useState<Date | undefined>(undefined);
  const [batchEndDate, setBatchEndDate] = useState<Date | undefined>(undefined);
  const [meetingLink, setMeetingLink] = useState('');
  const [capacity, setCapacity] = useState('30');

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
        // Fetch batches, courses, instructors, and students
        const [batchesResponse, coursesResponse, instructorsResponse, studentsResponse] = await Promise.all([
          getBatches(),
          getCourses(),
          getUsers(Role.instructor),
          getUsers(Role.student),
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

        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data);
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
    const matchesSearch = batch.batchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.course?.courseName && batch.course.courseName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCourse = selectedCourse === 'all' || 
      batch.courseId.toString() === selectedCourse;
    
    return matchesSearch && matchesCourse;
  });

  const handleCreateBatch = async () => {
    if (!batchName || !batchCourse || !batchInstructor || !batchStartDate || !batchEndDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate that start date is before end date
    if (batchStartDate >= batchEndDate) {
      toast({
        title: 'Validation Error',
        description: 'Start date must be before end date',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the batch in the database
      const response = await createBatch({
        batchName: batchName,
        courseId: parseInt(batchCourse),
        instructorId: parseInt(batchInstructor),
        startDate: batchStartDate.toISOString(),
        endDate: batchEndDate.toISOString(),
        capacity: parseInt(capacity),
        meetingLink
      });
      
      if (response.success && response.data) {
        toast({
          title: 'Batch created',
          description: `Batch "${batchName}" has been created successfully.`,
        });
        
        // Reset form fields
        resetFormFields();
        
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

  const handleEditBatch = async () => {
    if (!selectedBatch || !batchName || !batchCourse || !batchInstructor || !batchStartDate || !batchEndDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate that start date is before end date
    if (batchStartDate >= batchEndDate) {
      toast({
        title: 'Validation Error',
        description: 'Start date must be before end date',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Update the batch in the database
      const response = await updateBatch(selectedBatch.batchId, {
        batchName: batchName,
        courseId: parseInt(batchCourse),
        instructorId: parseInt(batchInstructor),
        startDate: batchStartDate.toISOString(),
        endDate: batchEndDate.toISOString(),
        capacity: parseInt(capacity),
        meetingLink
      });
      
      if (response.success && response.data) {
        toast({
          title: 'Batch updated',
          description: `Batch "${batchName}" has been updated successfully.`,
        });
        
        // Reset form fields
        resetFormFields();
        
        // Close the dialog
        setIsEditDialogOpen(false);
        
        // Refresh the batches list
        fetchBatches();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update batch',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to update batch',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!selectedBatch) return;
    
    setIsSubmitting(true);
    try {
      const response = await deleteBatch(selectedBatch.batchId);
      
      if (response.success) {
        toast({
          title: 'Batch deleted',
          description: `Batch "${selectedBatch.batchName}" has been deleted successfully.`,
        });
        
        // Close the dialog
        setIsDeleteDialogOpen(false);
        
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
      setIsSubmitting(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedBatch || !selectedStudentId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a student to enroll',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/batches/${selectedBatch.batchId}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: parseInt(selectedStudentId)
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Student enrolled',
          description: `Student has been enrolled to batch "${selectedBatch.batchName}" successfully.`,
        });
        
        // Reset selected student
        setSelectedStudentId('');
        
        // Close the dialog
        setIsEnrollDialogOpen(false);
        
        // Refresh the batches list
        fetchBatches();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to enroll student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        title: 'Error',
        description: 'Failed to enroll student',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!selectedBatch) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/batches/${selectedBatch.batchId}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Student removed',
          description: `Student has been removed from batch "${selectedBatch.batchName}" successfully.`,
        });
        
        // Refresh the batches list
        fetchBatches();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to remove student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove student',
        variant: 'destructive',
      });
    }
  };

  const resetFormFields = () => {
    setBatchName('');
    setBatchCourse('');
    setBatchInstructor('');
    setBatchStartDate(undefined);
    setBatchEndDate(undefined);
    setMeetingLink('');
    setCapacity('30');
    setSelectedBatch(null);
    setSelectedStudentId('');
  };

  const openEditDialog = (batch: Batch) => {
    setSelectedBatch(batch);
    setBatchName(batch.batchName);
    setBatchCourse(batch.courseId.toString());
    setBatchInstructor(batch.instructorId.toString());
    setBatchStartDate(new Date(batch.startDate));
    setBatchEndDate(new Date(batch.endDate));
    setMeetingLink(batch.meetingLink || '');
    setCapacity(batch.capacity?.toString() || '30');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsDeleteDialogOpen(true);
  };

  const openEnrollDialog = (batch: Batch) => {
    setSelectedBatch(batch);
    setIsEnrollDialogOpen(true);
  };

  const batchColumns = [
    {
      accessorKey: 'batchName',
      header: 'Batch Name',
      cell: (info: any) => <div className="font-medium">{info.getValue()}</div>,
    },
    {
      accessorKey: 'course',
      header: 'Course',
      cell: (info: any) => {
        const batch = info.row.original;
        return batch.course?.courseName || 'N/A';
      },
    },
    {
      accessorKey: 'instructor',
      header: 'Instructor',
      cell: (info: any) => {
        const batch = info.row.original;
        return batch.instructor?.fullName || 'N/A';
      },
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: (info: any) => {
        const date = new Date(info.getValue());
        return (
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            {format(date, 'MMM d, yyyy')}
          </div>
        );
      },
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: (info: any) => {
        const date = new Date(info.getValue());
        return format(date, 'MMM d, yyyy');
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: (info: any) => {
        const batch = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.location.href = `/batches/${batch.batchId}`}
              title="View Batch Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => openEditDialog(batch)}
              title="Edit Batch"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => openDeleteDialog(batch)}
              title="Delete Batch"
            >
              <Trash className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => openEnrollDialog(batch)}
              title="Enroll Students"
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        );
      },
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
                  <Label htmlFor="batchName">Batch Name*</Label>
                  <Input
                    id="batchName"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Enter batch name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="batchCourse">Course*</Label>
                  <Select value={batchCourse} onValueChange={setBatchCourse}>
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
                  <Label htmlFor="batchInstructor">Instructor*</Label>
                  <Select value={batchInstructor} onValueChange={setBatchInstructor}>
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
                  <Label htmlFor="batchStartDate">Start Date*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !batchStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {batchStartDate ? format(batchStartDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={batchStartDate}
                        onSelect={setBatchStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="batchEndDate">End Date*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !batchEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {batchEndDate ? format(batchEndDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={batchEndDate}
                        onSelect={setBatchEndDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Enter maximum students"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <Input
                    id="meetingLink"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="Enter meeting link URL"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleCreateBatch} 
                  disabled={isSubmitting || !batchName || !batchCourse || !batchInstructor || !batchStartDate || !batchEndDate}
                >
                  {isSubmitting ? 'Creating...' : 'Create Batch'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Batch Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Edit Batch</DialogTitle>
                <DialogDescription>
                  Update the details for this batch.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editBatchName">Batch Name*</Label>
                  <Input
                    id="editBatchName"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Enter batch name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editBatchCourse">Course*</Label>
                  <Select value={batchCourse} onValueChange={setBatchCourse}>
                    <SelectTrigger id="editBatchCourse">
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
                  <Label htmlFor="editBatchInstructor">Instructor*</Label>
                  <Select value={batchInstructor} onValueChange={setBatchInstructor}>
                    <SelectTrigger id="editBatchInstructor">
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
                  <Label htmlFor="editBatchStartDate">Start Date*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !batchStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {batchStartDate ? format(batchStartDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={batchStartDate}
                        onSelect={setBatchStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editBatchEndDate">End Date*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !batchEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {batchEndDate ? format(batchEndDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={batchEndDate}
                        onSelect={setBatchEndDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editCapacity">Capacity</Label>
                  <Input
                    id="editCapacity"
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="Enter maximum students"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editMeetingLink">Meeting Link</Label>
                  <Input
                    id="editMeetingLink"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="Enter meeting link URL"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleEditBatch} 
                  disabled={isSubmitting || !batchName || !batchCourse || !batchInstructor || !batchStartDate || !batchEndDate}
                >
                  {isSubmitting ? 'Updating...' : 'Update Batch'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Batch Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the batch "{selectedBatch?.batchName}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteBatch}
                  disabled={isSubmitting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Enroll Student Dialog */}
          <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Enroll Student</DialogTitle>
                <DialogDescription>
                  Enroll a student to batch "{selectedBatch?.batchName}".
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="selectStudent">Select Student</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger id="selectStudent">
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.userId} value={student.userId.toString()}>
                          {student.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedBatch && selectedBatch.students && selectedBatch.students.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Currently Enrolled Students</Label>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="w-[80px]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBatch.students.map((enrollment) => (
                            <TableRow key={enrollment.studentBatchId}>
                              <TableCell>{enrollment.student?.fullName}</TableCell>
                              <TableCell>{enrollment.student?.email}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveStudent(enrollment.studentId)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleEnrollStudent} 
                  disabled={isSubmitting || !selectedStudentId}
                >
                  {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
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
                  <CalendarIcon className="h-5 w-5 text-primary" />
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
                  {batches.reduce((total, batch) => total + (batch.students?.length || 0), 0)}
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
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="mt-2">Loading batches...</span>
              </div>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No batches found</h3>
              <p className="text-muted-foreground text-sm">
                {searchTerm || selectedCourse !== 'all'
                  ? 'Try changing your search or filter criteria'
                  : 'Start by creating a new batch'}
              </p>
            </div>
          ) : (
            <DataTable
              data={filteredBatches}
              columns={batchColumns}
              searchKey="batchName"
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Batches;
