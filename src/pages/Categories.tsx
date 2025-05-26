import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { getCategories, getCourses, createCategory, updateCategory, deleteCategory } from '@/lib/api';
import { Category, Course } from '@/lib/types';
import { Edit, Plus, Search, Tag, Trash, Book, ChevronDown, Grid, List } from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import './CategoriesTooltip.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SORT_OPTIONS = [
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'oldest', label: 'First Added' },
];

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  
  const { toast } = useToast();

  const [sortOption, setSortOption] = useState('az');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Generate a random pastel color for category
  const generatePastelColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const categoriesResponse = await getCategories();
      
      // Fetch courses
      const coursesResponse = await getCourses();
      
      if (categoriesResponse.success && categoriesResponse.data && 
          coursesResponse.success && coursesResponse.data) {
        
        const courseData = coursesResponse.data;
        setCourses(courseData);
        
        // Process categories with course counts
        const categoriesWithCourses = categoriesResponse.data.map(category => {
          const categoryCourses = courseData.filter(course => course.categoryId === category.categoryId);
          return {
            ...category,
            courses: categoryCourses,
            coursesCount: categoryCourses.length
          };
        });
        
        setCategories(categoriesWithCourses);
      } else {
        toast({
          title: 'Error',
          description: categoriesResponse.error || coursesResponse.error || 'Failed to fetch data',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while fetching data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetFormFields = () => {
    setCategoryName('');
    setCategoryDescription('');
    setSelectedCategory(null);
  };

  const handleCreateCategory = async () => {
    if (!categoryName) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createCategory({
        categoryName,
        description: categoryDescription || null
      });
      
      if (response.success && response.data) {
        toast({
          title: 'Category created',
          description: `Category "${categoryName}" has been created successfully.`,
        });
        
        // Reset form fields
        resetFormFields();
        
        // Close the dialog
        setIsAddDialogOpen(false);
        
        // Refresh categories
        fetchData();
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

  const handleEditCategory = async () => {
    if (!selectedCategory || !categoryName) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateCategory(selectedCategory.categoryId, {
        categoryName,
        description: categoryDescription || null
      });
      
      if (response.success && response.data) {
        toast({
          title: 'Category updated',
          description: `Category "${categoryName}" has been updated successfully.`,
        });
        
        // Reset form fields
        resetFormFields();
        
        // Close the dialog
        setIsEditDialogOpen(false);
        
        // Refresh categories
        fetchData();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update category',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setCategoryName(category.categoryName);
    setCategoryDescription(category.description || '');
    setIsEditDialogOpen(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    // Check if category has courses
    const categoryCourses = courses.filter(course => course.categoryId === category.categoryId);
    
    if (categoryCourses.length > 0) {
      toast({
        title: 'Cannot delete category',
        description: `This category has ${categoryCourses.length} course(s). Remove or reassign these courses first.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Confirm deletion
    const confirmed = window.confirm(`Are you sure you want to delete "${category.categoryName}"? This action cannot be undone.`);
    
    if (!confirmed) {
      return;
    }
    
    try {
      const response = await deleteCategory(category.categoryId);
      
      if (response.success) {
        toast({
          title: 'Category deleted',
          description: `Category "${category.categoryName}" has been deleted successfully.`,
        });
        
        // Refresh categories
        fetchData();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete category',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  // Sorting logic
  const sortedCategories = useMemo(() => {
    let sorted = [...categories];
    switch (sortOption) {
      case 'az':
        sorted.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
        break;
      case 'za':
        sorted.sort((a, b) => b.categoryName.localeCompare(a.categoryName));
        break;
      case 'recent':
        sorted.sort((a, b) => b.categoryId - a.categoryId); // Assuming higher ID = newer
        break;
      case 'oldest':
        sorted.sort((a, b) => a.categoryId - b.categoryId);
        break;
      default:
        break;
    }
    return sorted;
  }, [categories, sortOption]);

  // Add colors to categories
  const categoriesWithColors = sortedCategories.map(category => ({
    ...category,
    color: generatePastelColor()
  }));

  const filteredCategories = categoriesWithColors.filter((category) =>
    category.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Memoize the tooltip content for each category
  const categoryTooltips = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category.categoryId] = (
        <div className="max-w-xs p-2">
          <h5 className="font-medium mb-1">Courses in this category:</h5>
          {category.courses && category.courses.length > 0 ? (
            <ul className="list-disc pl-4 space-y-0.5">
              {category.courses.map(course => (
                <li key={course.courseId} className="text-sm">{course.courseName}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs">No courses in this category</p>
          )}
        </div>
      );
      return acc;
    }, {});
  }, [categories]);

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Categories', link: '/categories' }
      ]} />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage your course categories and organize your content.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-2"
            >
              <Grid className="h-4 w-4" />
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Add a new category for organizing your courses.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateCategory} 
                  disabled={isSubmitting || !categoryName}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? 'Creating...' : 'Create Category'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Sort Bar */}
      <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search categories..."
              className="pl-10 border-gray-200 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-56 relative">
            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="w-full border-gray-200">
                <SelectValue />
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
        </div>
      </div>

      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="shadow-md">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full rounded" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full rounded" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        )
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12">
          <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No categories found</h3>
          <p className="text-gray-500 mt-1">
            {searchTerm ? 'Try a different search term' : 'Create your first category to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.categoryId} className="shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div style={{ backgroundColor: category.color }} className="h-2" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  {category.categoryName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <span>Courses:</span>
                    <Tippy
                      content={categoryTooltips[category.categoryId]}
                      placement="top"
                      animation="scale"
                      duration={[100, 100]}
                      interactive={true}
                      maxWidth={300}
                      className="custom-tooltip-bg"
                    >
                      <span className="font-medium flex items-center gap-1 cursor-help">
                        <Book className="h-4 w-4" />
                        {category.coursesCount || 0}
                      </span>
                    </Tippy>
                  </div>
                  {category.courses && category.courses.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {category.courses.slice(0, 3).map((course) => (
                        <li key={course.courseId} className="text-xs truncate">
                          • {course.courseName}
                        </li>
                      ))}
                      {category.courses.length > 3 && (
                        <li className="text-xs text-blue-600">
                          + {category.courses.length - 3} more courses
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="pt-4 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditClick(category)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  onClick={() => handleDeleteCategory(category)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Courses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category, index) => (
                <TableRow key={category.categoryId}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">{category.categoryName}</TableCell>
                  <TableCell>
                    <Tippy
                      content={categoryTooltips[category.categoryId]}
                      placement="top"
                      animation="scale"
                      duration={[100, 100]}
                      interactive={true}
                      maxWidth={300}
                      className="custom-tooltip-bg"
                    >
                      <span className="font-medium flex items-center gap-1 cursor-help">
                        <Book className="h-4 w-4" />
                        {category.coursesCount || 0}
                      </span>
                    </Tippy>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(category)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the details for this category.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditCategory} 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
