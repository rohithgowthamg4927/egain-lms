
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
import BatchGrid from '@/components/batches/BatchGrid';
import { DataTable } from '@/components/ui/data-table';
import { 
  getBatches, 
  getCourses, 
  getUsers, 
  createBatch, 
  deleteBatch,
  updateBatch,
  enrollStudentToBatch,
  unenrollStudentFromBatch,
  getBatchStudents,
  getStudentsNotInBatch
} from '@/lib/api';
import { Batch, Course, User, Role } from '@/lib/types';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Eye, 
  Edit, 
  Trash, 
  User as UserIcon, 
  Clock, 
  CheckCircle2, 
  XCircle,
  UserPlus
} from 'lucide-react';
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

const Batches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStudentsDrawerOpen, setIsStudentsDrawerOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states for batch
  const [batchName, setBatchName] = useState('');
  const [batchCourse, setBatchCourse] = useState('');
  const [batchInstructor, setBatchInstructor] = useState('');
  const [batchCapacity, setBatchCapacity] = useState('30');
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');
  const [batchMeetingLink, setBatchMeetingLink] = useState('');

  const resetFormFields = () => {
    setBatchName('');
    setBatchCourse('');
    setBatchInstructor('');
    setBatchCapacity('30');
    setBatchStartDate('');
    setBatchEndDate('');
    setBatchMeetingLink('');
    setSelectedBatch(null);
  };

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
          getUsers(Role.student)
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
        } else {
          toast({
            title: 'Error',
            description: studentsResponse.error || 'Failed to fetch students',
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
    if (!batchName || !batchCourse || !batchInstructor || !batchStartDate || !batchEndDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
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
        startDate: new Date(batchStartDate).toISOString(),
        endDate: new Date(batchEndDate).toISOString(),
        capacity: parseInt(batchCapacity),
        meetingLink: batchMeetingLink
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

    setIsSubmitting(true);
    try {
      // Update the batch in the database
      const response = await updateBatch(selectedBatch.batchId, {
        batchName: batchName,
        courseId: parseInt(batchCourse),
        instructorId: parseInt(batchInstructor),
        startDate: new Date(batchStartDate).toISOString(),
        endDate: new Date(batchEndDate).toISOString(),
        capacity: parseInt(batchCapacity),
        meetingLink: batchMeetingLink
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

  const handleViewBatch = (batch: Batch) => {
    // Navigate to batch details page
    window.location.href = `/batches/${batch.batchId}`;
  };

  const handleEditBatchClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setBatchName(batch.batchName);
    setBatchCourse(batch.courseId.toString());
    setBatchInstructor(batch.instructorId.toString());
    setBatchStartDate(new Date(batch.startDate).toISOString().split('T')[0]);
    setBatchEndDate(new Date(batch.endDate).toISOString().split('T')[0]);
    setBatchCapacity(batch.capacity?.toString() || '30');
    setBatchMeetingLink(batch.meetingLink || '');
    setIsEditDialogOpen(true);
  };

  const handleDeleteBatch = async (batch: Batch) => {
    try {
      const response = await deleteBatch(batch.batchId);
      
      if (response.success) {
        toast({
          title: 'Batch deleted',
          description: `Batch "${batch.batchName}" has been deleted successfully.`,
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
    }
  };

  const handleManageStudents = async (batch: Batch) => {
    setSelectedBatch(batch);
    setSelectedStudents([]);
    setIsStudentsDrawerOpen(true);

    try {
      // Fetch students not in this batch for enrollment options
      const response = await getStudentsNotInBatch(batch.batchId);
      if (response.success && response.data) {
        setAvailableStudents(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch available students',
          variant: 'destructive',
        });
      }

      // Fetch current batch students
      const batchStudentsResponse = await getBatchStudents(batch.batchId);
      if (batchStudentsResponse.success && batchStudentsResponse.data) {
        // Handle the current enrolled students
        console.log("Current enrolled students:", batchStudentsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch student data',
        variant: 'destructive',
      });
    }
  };

  const handleEnrollStudents = async () => {
    if (!selectedBatch || selectedStudents.length === 0) {
      toast({
        title: 'No students selected',
        description: 'Please select at least one student to enroll',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Enroll each selected student
      const enrollmentPromises = selectedStudents.map(studentId => 
        enrollStudentToBatch(studentId, selectedBatch.batchId)
      );
      
      const results = await Promise.all(enrollmentPromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      if (successCount > 0) {
        toast({
          title: 'Students enrolled',
          description: `Successfully enrolled ${successCount} student${successCount !== 1 ? 's' : ''} to the batch.${failCount > 0 ? ` ${failCount} enrollment${failCount !== 1 ? 's' : ''} failed.` : ''}`,
        });
        
        // Close the drawer and refresh batches
        setIsStudentsDrawerOpen(false);
        fetchBatches();
      } else {
        toast({
          title: 'Enrollment failed',
          description: 'Failed to enroll any students to the batch',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error enrolling students:', error);
      toast({
        title: 'Error',
        description: 'Failed to enroll students',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

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
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Enter batch name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="batchCourse">Course</Label>
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
                  <Label htmlFor="batchInstructor">Instructor</Label>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="batchStartDate">Start Date</Label>
                    <Input
                      id="batchStartDate"
                      type="date"
                      value={batchStartDate}
                      onChange={(e) => setBatchStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="batchEndDate">End Date</Label>
                    <Input
                      id="batchEndDate"
                      type="date"
                      value={batchEndDate}
                      onChange={(e) => setBatchEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="batchCapacity">Capacity</Label>
                  <Input
                    id="batchCapacity"
                    type="number"
                    value={batchCapacity}
                    onChange={(e) => setBatchCapacity(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="batchMeetingLink">Meeting Link (Optional)</Label>
                  <Input
                    id="batchMeetingLink"
                    value={batchMeetingLink}
                    onChange={(e) => setBatchMeetingLink(e.target.value)}
                    placeholder="Enter meeting link"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateBatch} 
                  disabled={isSubmitting || !batchName || !batchCourse || !batchInstructor || !batchStartDate || !batchEndDate}
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

        <BatchGrid
          batches={filteredBatches}
          loading={isLoading}
          onView={handleViewBatch}
          onEdit={handleEditBatchClick}
          onDelete={handleDeleteBatch}
          onManageStudents={handleManageStudents}
        />

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
                <Label htmlFor="editBatchName">Batch Name</Label>
                <Input
                  id="editBatchName"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editBatchCourse">Course</Label>
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
                <Label htmlFor="editBatchInstructor">Instructor</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editBatchStartDate">Start Date</Label>
                  <Input
                    id="editBatchStartDate"
                    type="date"
                    value={batchStartDate}
                    onChange={(e) => setBatchStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editBatchEndDate">End Date</Label>
                  <Input
                    id="editBatchEndDate"
                    type="date"
                    value={batchEndDate}
                    onChange={(e) => setBatchEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editBatchCapacity">Capacity</Label>
                <Input
                  id="editBatchCapacity"
                  type="number"
                  value={batchCapacity}
                  onChange={(e) => setBatchCapacity(e.target.value)}
                  min="1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editBatchMeetingLink">Meeting Link (Optional)</Label>
                <Input
                  id="editBatchMeetingLink"
                  value={batchMeetingLink}
                  onChange={(e) => setBatchMeetingLink(e.target.value)}
                  placeholder="Enter meeting link"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditBatch} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Students Drawer */}
        <Drawer open={isStudentsDrawerOpen} onOpenChange={setIsStudentsDrawerOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>Manage Students</DrawerTitle>
              <DrawerDescription>
                {selectedBatch ? `Enroll students to the batch: ${selectedBatch.batchName}` : 'Loading...'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  className="pl-10"
                />
              </div>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {availableStudents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No available students to enroll
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableStudents.map((student) => (
                      <div key={student.userId} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`student-${student.userId}`} 
                          checked={selectedStudents.includes(student.userId)}
                          onCheckedChange={() => toggleStudentSelection(student.userId)}
                        />
                        <Label 
                          htmlFor={`student-${student.userId}`}
                          className="flex flex-1 items-center justify-between cursor-pointer p-2 hover:bg-muted rounded"
                        >
                          <div className="flex items-center gap-3">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{student.fullName}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{student.email}</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
            <DrawerFooter className="pt-2">
              <Button 
                onClick={handleEnrollStudents}
                disabled={selectedStudents.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  'Enrolling Students...'
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll Selected Students ({selectedStudents.length})
                  </>
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </Layout>
  );
};

export default Batches;
