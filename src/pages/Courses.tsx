
import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import CourseGrid from '@/components/courses/CourseGrid';
import { DataTable } from '@/components/ui/data-table';
import { getCourses, getCategories, createCourse, createCategory } from '@/lib/api';
import { Course, CourseCategory, Level } from '@/lib/types';
import { Plus, Search, ListFilter, Grid, List, Eye, Edit, Trash } from 'lucide-react';
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

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Form states for creating a new course
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('');
  const [newCourseLevel, setNewCourseLevel] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');

  const fetchCourses = async () => {
    try {
      const coursesResponse = await getCourses();
      if (coursesResponse.success && coursesResponse.data) {
        setCourses(coursesResponse.data);
      } else {
        toast({
          title: 'Error',
          description: coursesResponse.error || 'Failed to fetch courses',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch courses',
        variant: 'destructive',
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesResponse = await getCategories();
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      } else {
        toast({
          title: 'Error',
          description: categoriesResponse.error || 'Failed to fetch categories',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch categories',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        await Promise.all([fetchCourses(), fetchCategories()]);
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a category name',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createCategory({
        categoryName: newCategoryName.trim()
      });
      
      if (response.success && response.data) {
        toast({
          title: 'Category created',
          description: `Category "${newCategoryName}" has been created successfully.`,
        });
        
        // Reset form field
        setNewCategoryName('');
        
        // Close the dialog
        setIsCategoryDialogOpen(false);
        
        // Refresh the categories list
        fetchCategories();
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

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      course.categoryId.toString() === selectedCategory;
    
    const matchesLevel = selectedLevel === 'all' || 
      course.courseLevel === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const handleCreateCourse = async () => {
    if (!newCourseName || !newCourseCategory || !newCourseLevel) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Creating course with data:", {
        courseName: newCourseName,
        categoryId: parseInt(newCourseCategory),
        courseLevel: newCourseLevel as Level,
        description: newCourseDescription,
        isPublished: true
      });
      
      // Create the actual course in the database
      const response = await createCourse({
        courseName: newCourseName,
        categoryId: parseInt(newCourseCategory),
        courseLevel: newCourseLevel as Level,
        description: newCourseDescription,
        isPublished: true
      });
      
      if (response.success && response.data) {
        toast({
          title: 'Course created',
          description: `Course "${newCourseName}" has been created successfully.`,
        });
        
        // Reset form fields
        setNewCourseName('');
        setNewCourseCategory('');
        setNewCourseLevel('');
        setNewCourseDescription('');
        
        // Close the dialog
        setIsCreateDialogOpen(false);
        
        // Refresh the courses list
        fetchCourses();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create course',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const courseColumns = [
    {
      accessorKey: 'courseName' as keyof Course,
      header: 'Course Name',
    },
    {
      accessorKey: 'courseLevel' as keyof Course,
      header: 'Level',
      cell: (info: any) => {
        const course = info.row.original;
        return <span className="capitalize">{course.courseLevel.toLowerCase()}</span>;
      },
    },
    {
      accessorKey: 'category' as keyof Course,
      header: 'Category',
      cell: (info: any) => {
        const course = info.row.original;
        return course.category?.categoryName || 'N/A';
      },
    },
    {
      accessorKey: 'students' as keyof Course,
      header: 'Students',
      cell: (info: any) => {
        const course = info.row.original;
        return course.students || 0;
      },
    },
    {
      accessorKey: 'batches' as keyof Course,
      header: 'Batches',
      cell: (info: any) => {
        const course = info.row.original;
        return course.batches || 0;
      },
    },
    {
      accessorKey: 'averageRating' as keyof Course,
      header: 'Rating',
      cell: (info: any) => {
        const course = info.row.original;
        return (
          <div className="flex items-center">
            <span className="text-amber-500 mr-1">★</span>
            {course.averageRating?.toFixed(1) || 'N/A'}
          </div>
        );
      },
    },
  ];

  const courseActions = [
    {
      label: 'View',
      onClick: (course: Course) => {
        navigate(`/courses/${course.courseId}`);
      },
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: 'Edit',
      onClick: (course: Course) => {
        toast({
          title: 'Edit Course',
          description: `Editing: ${course.courseName}`,
        });
      },
      icon: <Edit className="h-4 w-4" />,
    },
    {
      label: 'Delete',
      onClick: (course: Course) => {
        toast({
          title: 'Delete Course',
          description: `Are you sure you want to delete ${course.courseName}?`,
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
          <h1 className="text-3xl font-bold">Courses</h1>
          <div className="flex gap-2">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Enter a name for the new course category.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCategory} 
                    disabled={isSubmitting || !newCategoryName.trim()}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Category'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new course.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="courseName">Course Name</Label>
                    <Input
                      id="courseName"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      placeholder="Enter course name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="courseCategory">Category</Label>
                    <Select value={newCourseCategory} onValueChange={setNewCourseCategory}>
                      <SelectTrigger id="courseCategory">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.categoryId} value={category.categoryId.toString()}>
                            {category.categoryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="courseLevel">Level</Label>
                    <Select value={newCourseLevel} onValueChange={setNewCourseLevel}>
                      <SelectTrigger id="courseLevel">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="courseDescription">Description</Label>
                    <Input
                      id="courseDescription"
                      value={newCourseDescription}
                      onChange={(e) => setNewCourseDescription(e.target.value)}
                      placeholder="Enter course description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateCourse} 
                    disabled={isSubmitting || !newCourseName || !newCourseCategory || !newCourseLevel}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Course'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px]">
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
              
              <Select
                value={selectedLevel}
                onValueChange={setSelectedLevel}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center border rounded-md p-1 bg-muted/30">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredCourses.length} of {courses.length} courses
            </p>
            <Button variant="outline" size="sm">
              <ListFilter className="h-4 w-4 mr-2" />
              Save Filter
            </Button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <CourseGrid courses={filteredCourses} loading={isLoading} />
        ) : (
          <div className="bg-card rounded-lg border overflow-hidden">
            <DataTable
              data={filteredCourses}
              columns={courseColumns}
              actions={courseActions}
              className="w-full"
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Courses;
