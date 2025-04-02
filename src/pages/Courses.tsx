import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getCourses, getCategories, createCategory } from '@/lib/api';
import { Course, Category, Level } from '@/lib/types';
import { Search, BookOpen, Users, Layers, Plus } from 'lucide-react';
import CourseGrid from '@/components/courses/CourseGrid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateCategoryDialogOpen, setIsCreateCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [coursesResponse, categoriesResponse] = await Promise.all([
          getCourses(),
          getCategories(),
        ]);

        if (coursesResponse.success && coursesResponse.data) {
          setCourses(coursesResponse.data);
        } else {
          toast({
            title: 'Error',
            description: coursesResponse.error || 'Failed to fetch courses',
            variant: 'destructive',
          });
        }

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
  }, [toast]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || course.categoryId.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleViewCourse = (course: Course) => {
    // Navigate to course details page
    console.log('View course:', course);
  };

  const handleEditCourse = (course: Course) => {
    // Open edit course dialog or navigate to edit page
    console.log('Edit course:', course);
  };

  const handleDeleteCourse = (course: Course) => {
    // Delete course
    console.log('Delete course:', course);
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
        
        // Update categories list
        if (response.data) {
          setCategories(prev => [...prev, response.data as Category]);
        }
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
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold">Courses</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
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
  );
};

export default Courses;
