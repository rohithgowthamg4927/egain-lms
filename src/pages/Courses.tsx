import { useState, useEffect, useRef } from 'react';
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
import { Search, BookOpen, Users, Layers, Plus, Grid, List, LayoutGrid, X } from 'lucide-react';
import CourseGrid from '@/components/courses/CourseGrid';
import CourseList from '@/components/courses/CourseList';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { useAuth } from '@/hooks/use-auth';

const SORT_OPTIONS = [
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'oldest', label: 'First Added' },
];

const LEVEL_OPTIONS = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

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
  const [sortOption, setSortOption] = useState('az');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Course[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

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

  const courses = coursesQuery.data?.data || [];
  const categories = categoriesQuery.data?.data || [];
  const isLoading = coursesQuery.isLoading || categoriesQuery.isLoading;
  const isError = coursesQuery.isError || categoriesQuery.isError;

  useEffect(() => {
    // Show errors if data fetching fails
    if (coursesQuery.isError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch courses. Please try refreshing the page.',
        variant: 'destructive',
      });
    }

    if (categoriesQuery.isError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch categories. Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  }, [coursesQuery.isError, categoriesQuery.isError, toast]);

  // Refetch data function
  const refetchData = () => {
    coursesQuery.refetch();
    categoriesQuery.refetch();
    countsQuery.refetch();
  };

  // Automatically refetch when the component mounts
  useEffect(() => {
    refetchData();
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions when search term changes
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = courses.filter(course => 
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, courses]);

  const handleSuggestionClick = (course: Course) => {
    setSearchTerm(course.courseName);
    setShowSuggestions(false);
    navigate(`/courses/${course.courseId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load courses</p>
          <Button onClick={refetchData}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Sorting and filtering logic
  const filteredCourses = courses
    .filter((course) => {
    const matchesSearch =
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'all' || course.categoryId.toString() === selectedCategory;
      const matchesLevel =
        selectedLevel === 'all' || (course.courseLevel && course.courseLevel === selectedLevel);
      return matchesSearch && matchesCategory && matchesLevel;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'az':
          return a.courseName.localeCompare(b.courseName);
        case 'za':
          return b.courseName.localeCompare(a.courseName);
        case 'recent':
          return b.courseId - a.courseId; // Assuming higher ID = newer
        case 'oldest':
          return a.courseId - b.courseId;
        default:
          return 0;
      }
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
    <div className="animate-fade-in">
      <BreadcrumbNav items={[
        { label: 'Courses', link: '/courses' }
      ]} />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Courses</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          {isAdmin && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/courses/add')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          )}
        </div>
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
              <span className="text-3xl font-bold">{studentsCount}</span>
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
          <div className="flex-1 relative" ref={searchRef}>
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search courses..."
              className="pl-10 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setSearchTerm('');
                  setShowSuggestions(false);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                {suggestions.map((course) => (
                  <div
                    key={course.courseId}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => handleSuggestionClick(course)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSuggestionClick(course);
                      }
                    }}
                  >
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium">{course.courseName}</div>
                      {course.description && (
                        <div className="text-sm text-gray-500 truncate">
                          {course.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Sorting Dropdown */}
          <div className="w-full md:w-48">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full border-gray-200">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Category and Level Dropdowns */}
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
            {isAdmin && (
              <Select
                value={selectedLevel}
                onValueChange={setSelectedLevel}
              >
                <SelectTrigger className="w-[150px] border-gray-200">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isAdmin && (
              <Dialog open={isCreateCategoryDialogOpen} onOpenChange={setIsCreateCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300"
                  >
                    <Plus className="h-4 w-4 mr-1" />
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
            )}
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <CourseGrid
          courses={filteredCourses}
          loading={isLoading}
          onView={handleViewCourse}
          onEdit={isAdmin ? handleEditCourse : undefined}
          onDelete={isAdmin ? handleDeleteCourse : undefined}
        />
      ) : (
        <CourseList
          courses={filteredCourses}
          onView={handleViewCourse}
          onEdit={isAdmin ? handleEditCourse : undefined}
          onDelete={isAdmin ? handleDeleteCourse : undefined}
        />
      )}

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
    </div>
  );
};

export default Courses;
