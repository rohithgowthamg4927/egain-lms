
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getCourses, getCategories, createCategory, deleteCourse } from '@/lib/api';
import { Course, Category, Level } from '@/lib/types';
import { Search, BookOpen, Users, Layers, Plus } from 'lucide-react';
import CourseGrid from '@/components/courses/CourseGrid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Layout from '@/components/layout/Layout';

const Courses = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use React Query for data fetching
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });

  const courses = coursesQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];
  const isLoading = coursesQuery.isLoading || categoriesQuery.isLoading;

  useEffect(() => {
    // Show errors if data fetching fails
    if (coursesQuery.isError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive',
      });
    }

    if (categoriesQuery.isError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive',
      });
    }
  }, [coursesQuery.isError, categoriesQuery.isError, toast]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || course.categoryId.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleViewCourse = (course: Course) => {
    navigate(`/courses/${course.courseId}`);
  };

  const handleEditCourse = (course: Course) => {
    navigate(`/courses/edit/${course.courseId}`);
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await deleteCourse(courseToDelete.courseId);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Course deleted successfully',
        });
        
        // Refresh the courses list
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete course',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName) {
      toast({
        title: 'Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createCategory({
        categoryName: newCategoryName,
        description: '', // Pass an empty string instead of null
      });

      if (response.success && response.data) {
        toast({
          title: 'Success',
          description: `Category "${newCategoryName}" has been created`,
        });
        setNewCategoryName('');
        setIsCreateCategoryDialogOpen(false);
        
        // Refresh categories using React Query
        queryClient.invalidateQueries({ queryKey: ['categories'] });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create category',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold">Courses</h1>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/courses/add')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="shadow-md border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{courses.length}</span>
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
                <span className="text-3xl font-bold">
                  {courses.reduce((total, course) => total + (course.students || 0), 0)}
                </span>
                <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{categories.length}</span>
                <div className="h-10 w-10 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search courses..."
                className="pl-10 border-gray-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px] border-gray-200">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                      {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Create category</DialogTitle>
                    <DialogDescription>
                      Add a new category to group your courses.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Category name</Label>
                      <Input
                        id="name"
                        placeholder="Category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateCategoryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateCategory} 
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <CourseGrid
          courses={filteredCourses}
          loading={isLoading}
          onView={handleViewCourse}
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course
              "{courseToDelete?.courseName}" and remove any associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCourse}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Courses;
