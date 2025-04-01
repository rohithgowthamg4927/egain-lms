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
import { Input } from '@/components/ui/input';
import Layout from '@/components/layout/Layout';
import CourseGrid from '@/components/courses/CourseGrid';
import { getCourses, getCategories, createCourse, createCategory, deleteCourse, getCourseById, updateCourse } from '@/lib/api';
import { Course, CourseCategory, Level } from '@/lib/types';
import { Plus, Search, ListFilter, Trash, Edit, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [courseToView, setCourseToView] = useState<Course | null>(null);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  
  // Form states for creating a new course
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('');
  const [newCourseLevel, setNewCourseLevel] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');

  // Form states for editing a course
  const [editCourseName, setEditCourseName] = useState('');
  const [editCourseCategory, setEditCourseCategory] = useState('');
  const [editCourseLevel, setEditCourseLevel] = useState<string>('');
  const [editCourseDescription, setEditCourseDescription] = useState('');

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

  const handleViewCourse = async (course: Course) => {
    setIsLoading(true);
    try {
      const response = await getCourseById(course.courseId);
      if (response.success && response.data) {
        setCourseToView(response.data);
        setIsViewDialogOpen(true);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to fetch course details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch course details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setCourseToEdit(course);
    setEditCourseName(course.courseName);
    setEditCourseCategory(course.categoryId.toString());
    setEditCourseLevel(course.courseLevel);
    setEditCourseDescription(course.description || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!courseToEdit) return;
    
    if (!editCourseName || !editCourseCategory || !editCourseLevel) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedCourse = {
        ...courseToEdit,
        courseName: editCourseName,
        categoryId: parseInt(editCourseCategory),
        courseLevel: editCourseLevel as Level,
        description: editCourseDescription,
      };
      
      const response = await updateCourse(courseToEdit.courseId, updatedCourse);
      
      if (response.success && response.data) {
        toast({
          title: 'Course updated',
          description: `Course "${editCourseName}" has been updated successfully.`,
        });
        
        setIsEditDialogOpen(false);
        setCourseToEdit(null);
        
        // Refresh the courses list
        fetchCourses();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update course',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to update course',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    setCourseToDelete(course);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    setIsSubmitting(true);
    try {
      const response = await deleteCourse(courseToDelete.courseId);
      
      if (response.success) {
        toast({
          title: 'Course deleted',
          description: `Course "${courseToDelete.courseName}" has been deleted successfully.`,
        });
        
        setCourseToDelete(null);
        
        // Refresh the courses list
        fetchCourses();
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
        description: 'Failed to delete course',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout noHeader={true}>
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

        <CourseGrid 
          courses={filteredCourses} 
          loading={isLoading} 
          onView={handleViewCourse}
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
        />

        {/* View Course Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Course Details</DialogTitle>
            </DialogHeader>
            {courseToView && (
              <div className="py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Course Name</h3>
                    <p className="text-lg">{courseToView.courseName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Category</h3>
                    <p className="text-lg">{courseToView.category?.categoryName || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Level</h3>
                    <p className="text-lg capitalize">{courseToView.courseLevel.toLowerCase()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <p className="text-lg">{courseToView.isPublished ? 'Published' : 'Not Published'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                  <p className="text-base mt-1">{courseToView.description || 'No description available.'}</p>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                  <p className="text-base">{new Date(courseToView.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                if (courseToView) {
                  handleEditCourse(courseToView);
                }
              }}>
                Edit Course
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Course Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update the details of this course.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editCourseName">Course Name</Label>
                <Input
                  id="editCourseName"
                  value={editCourseName}
                  onChange={(e) => setEditCourseName(e.target.value)}
                  placeholder="Enter course name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editCourseCategory">Category</Label>
                <Select value={editCourseCategory} onValueChange={setEditCourseCategory}>
                  <SelectTrigger id="editCourseCategory">
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
                <Label htmlFor="editCourseLevel">Level</Label>
                <Select value={editCourseLevel} onValueChange={setEditCourseLevel}>
                  <SelectTrigger id="editCourseLevel">
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
                <Label htmlFor="editCourseDescription">Description</Label>
                <Input
                  id="editCourseDescription"
                  value={editCourseDescription}
                  onChange={(e) => setEditCourseDescription(e.target.value)}
                  placeholder="Enter course description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={isSubmitting || !editCourseName || !editCourseCategory || !editCourseLevel}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Course Dialog */}
        <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this course?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the course 
                "{courseToDelete?.courseName}" and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteCourse}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Course'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Courses;
