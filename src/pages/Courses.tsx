
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getCourses, getCategories, createCategory, deleteCourse } from '@/lib/api';
import { getDashboardCounts } from '@/lib/api/dashboard';
import { Course, Category, Level, Role } from '@/lib/types';
import { Search, BookOpen, Users, Layers, Plus } from 'lucide-react';
import CourseGrid from '@/components/courses/CourseGrid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { useAuth } from '@/hooks/use-auth';

const Courses = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [studentsCount, setStudentsCount] = useState(0);

  // Fetch dashboard counts for student metrics
  const countsQuery = useQuery({
    queryKey: ['dashboardCounts'],
    queryFn: getDashboardCounts
  });

  // Use React Query for data fetching
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Set student count from dashboard counts
  useEffect(() => {
    if (countsQuery.data?.success && countsQuery.data?.data) {
      setStudentsCount(countsQuery.data.data.studentsCount);
    }
  }, [countsQuery.data]);

  // Handle course view
  const handleViewCourse = (course: Course) => {
    navigate(`/courses/${course.courseId}`);
  };

  // Handle course edit (admin only)
  const handleEditCourse = (course: Course) => {
    if (!isAdmin) return;
    navigate(`/courses/edit/${course.courseId}`);
  };

  // Handle course delete (admin only)
  const handleDeleteCourse = (course: Course) => {
    if (!isAdmin) return;
    setCourseToDelete(course);
    setIsDeleteDialogOpen(true);
  };

  // Confirm course deletion
  const confirmDeleteCourse = async () => {
    if (!courseToDelete || !isAdmin) return;
    
    setIsDeleting(true);
    try {
      const response = await deleteCourse(courseToDelete.courseId);
      
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        toast({
          title: 'Course deleted',
          description: `Course "${courseToDelete.courseName}" has been deleted successfully.`,
        });
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
        description: 'An unexpected error occurred while deleting the course',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  // Handle category creation
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !isAdmin) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await createCategory({ categoryName: newCategoryName.trim() });
      
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        toast({
          title: 'Category created',
          description: `Category "${newCategoryName}" has been created successfully.`,
        });
        setNewCategoryName('');
        setIsCreateCategoryDialogOpen(false);
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
        description: 'An unexpected error occurred while creating the category',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter courses based on search term and selected category
  const filteredCourses = coursesQuery.data?.data
    ? coursesQuery.data.data.filter((course) => {
        const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || (course.categoryId && course.categoryId.toString() === selectedCategory);
        return matchesSearch && matchesCategory;
      })
    : [];

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[{ label: 'Courses', link: '/courses' }]} />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Courses</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => navigate('/courses/add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
            <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Add a new category for organizing courses.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="mt-1"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCategory} disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Category'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {coursesQuery.data?.data?.length || 0}
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{studentsCount}</span>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {categoriesQuery.data?.data?.length || 0}
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
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
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesQuery.data?.data?.map((category) => (
                  <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                    {category.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <CourseGrid
        courses={filteredCourses}
        loading={coursesQuery.isLoading}
        onView={handleViewCourse}
        onEdit={isAdmin ? handleEditCourse : undefined}
        onDelete={isAdmin ? handleDeleteCourse : undefined}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this course? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCourse} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Courses;
