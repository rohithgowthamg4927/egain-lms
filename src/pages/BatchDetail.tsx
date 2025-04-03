
// Note: Fixing TypeScript errors in BatchDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  getBatch, 
  getBatchStudents,
  enrollStudentInBatch,
  unenrollStudentFromBatch 
} from '@/lib/api/batches';
import { Batch, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Pencil, 
  User as UserIcon, 
  CalendarDays, 
  Clock, 
  BookOpen, 
  Users, 
  Phone, 
  Mail, 
  PlusCircle, 
  Trash2, 
  Search, 
  Check, 
  X 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils/date-helpers';

const BatchDetail = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [availableStudents, setAvailableStudents] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<User | null>(null);

  useEffect(() => {
    const loadBatchDetails = async () => {
      if (!batchId) return;
      
      try {
        setLoading(true);
        const batchResponse = await getBatch(parseInt(batchId));
        
        if (batchResponse.success && batchResponse.data) {
          setBatch(batchResponse.data);
        } else {
          toast({
            title: "Error",
            description: batchResponse.error || "Could not load batch details",
            variant: "destructive",
          });
        }
        
        const studentsResponse = await getBatchStudents(parseInt(batchId));
        
        if (studentsResponse.success && studentsResponse.data) {
          setStudents(studentsResponse.data);
          setFilteredStudents(studentsResponse.data);
        } else {
          toast({
            title: "Error",
            description: studentsResponse.error || "Could not load batch students",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading batch details:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadBatchDetails();
  }, [batchId, toast]);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  const handleEditClick = () => {
    if (batchId) {
      navigate(`/batches/${batchId}/edit`);
    }
  };

  const handleAddStudent = () => {
    setIsAddDialogOpen(true);
    // Here you would fetch available students who are not already in the batch
    // For now, we'll simulate this with mock data
    const mockAvailableStudents = [
      // Mock data here, or use API call to get real available students
    ];
    setAvailableStudents(mockAvailableStudents);
  };

  const handleSearchAvailableStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddStudentToBatch = async () => {
    if (!batchId || !selectedStudent) return;
    
    try {
      const response = await enrollStudentInBatch(selectedStudent.id, parseInt(batchId));
      
      if (response.success) {
        setStudents([...students, selectedStudent]);
        setIsAddDialogOpen(false);
        setSelectedStudent(null);
        toast({
          title: "Success",
          description: "Student added to batch successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Could not add student to batch",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding student to batch:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleRemoveStudent = (student: User) => {
    setStudentToRemove(student);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveStudent = async () => {
    if (!batchId || !studentToRemove) return;
    
    try {
      const response = await unenrollStudentFromBatch(studentToRemove.id, parseInt(batchId));
      
      if (response.success) {
        setStudents(students.filter(s => s.id !== studentToRemove.id));
        setIsRemoveDialogOpen(false);
        setStudentToRemove(null);
        toast({
          title: "Success",
          description: "Student removed from batch successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Could not remove student from batch",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing student from batch:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Generate breadcrumb items
  const breadcrumbItems = [
    { label: 'Batches', link: '/batches' },
    { label: batch?.batchName || 'Batch Details', link: `/batches/${batchId}` },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading batch details...</div>;
  }

  if (!batch) {
    return <div className="text-center p-8">Batch not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{batch.batchName}</h1>
          <p className="text-muted-foreground text-lg">Batch #{batch.batchId}</p>
        </div>
        <Button onClick={handleEditClick} className="flex items-center gap-1">
          <Pencil className="h-4 w-4" />
          Edit Batch
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="details">Batch Details</TabsTrigger>
          <TabsTrigger value="students">Enrolled Students ({students.length})</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>General details about this batch</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Course</p>
                    <p className="font-medium flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      {batch.course?.courseName || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Instructor</p>
                    <p className="font-medium flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      {batch.instructor?.fullName || "Not assigned"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Current Students</p>
                    <p className="font-medium flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {students.length} / {batch.students?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Information</CardTitle>
                <CardDescription>When this batch is conducted</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="font-medium flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      {formatDate(batch.startDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="font-medium flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      {formatDate(batch.endDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                    <p className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {batch.schedules?.[0]?.time || "No schedule set"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Batch Description</CardTitle>
              <CardDescription>Detailed information about this batch</CardDescription>
            </CardHeader>
            <CardContent>
              {batch.notes ? (
                <div className="prose prose-sm max-w-none">
                  <p>{batch.notes}</p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No description provided</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleAddStudent} className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              Add Student
            </Button>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No students enrolled in this batch yet</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Avatar>
                              <AvatarImage src={student.photoUrl || ""} alt={student.fullName} />
                              <AvatarFallback>{student.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium">{student.fullName}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phoneNumber || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveStudent(student)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Add Student Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Student to Batch</DialogTitle>
                <DialogDescription>
                  Select a student to add to this batch
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students by name or email..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={handleSearchAvailableStudents}
                  />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {availableStudents.length === 0 ? (
                    <p className="text-center text-muted-foreground p-4">
                      No available students found
                    </p>
                  ) : (
                    availableStudents.map(student => (
                      <div
                        key={student.id}
                        className={`p-2 rounded-md cursor-pointer flex items-center space-x-2 ${
                          selectedStudent?.id === student.id ? 'bg-primary/10' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.photoUrl || ""} alt={student.fullName} />
                          <AvatarFallback>{student.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{student.fullName}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                        {selectedStudent?.id === student.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStudentToBatch}
                  disabled={!selectedStudent}
                >
                  Add Student
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Remove Student Dialog */}
          <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Remove Student from Batch</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove this student from the batch?
                </DialogDescription>
              </DialogHeader>
              {studentToRemove && (
                <div className="flex items-center space-x-2 py-4">
                  <Avatar>
                    <AvatarImage src={studentToRemove.photoUrl || ""} alt={studentToRemove.fullName} />
                    <AvatarFallback>{studentToRemove.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{studentToRemove.fullName}</p>
                    <p className="text-sm text-muted-foreground">{studentToRemove.email}</p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmRemoveStudent}
                >
                  Remove
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Batch Schedule</CardTitle>
              <CardDescription>Class schedule and timing information</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Schedule content here */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Days</p>
                  <p>{batch.schedules?.[0]?.days || "Not specified"}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Timings</p>
                  <p>{batch.schedules?.[0]?.time || "Not specified"}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Location</p>
                  <p>{batch.schedules?.[0]?.location || "Not specified"}</p>
                </div>
                {batch.schedules?.[0]?.meetingLink && (
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Online Meeting Link</p>
                    <a 
                      href={batch.schedules?.[0]?.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BatchDetail;
