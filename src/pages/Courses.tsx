
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
import Layout from '@/components/layout/Layout';
import CourseGrid from '@/components/courses/CourseGrid';
import { DataTable } from '@/components/ui/data-table';
import { getCourses, getCategories } from '@/lib/api';
import { Course, CourseCategory, Level } from '@/lib/types';
import { Plus, Search, ListFilter, Grid, List, Eye, Edit, Trash } from 'lucide-react';

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

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
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      course.categoryId.toString() === selectedCategory;
    
    const matchesLevel = selectedLevel === 'all' || 
      course.courseLevel === selectedLevel;
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const handleCreateCourse = () => {
    toast({
      title: 'Create Course',
      description: 'This feature is not implemented in the demo.',
    });
  };

  const courseColumns = [
    {
      accessorKey: 'courseName' as keyof Course,
      header: 'Course Name',
    },
    {
      accessorKey: 'courseLevel' as keyof Course,
      header: 'Level',
      cell: (course: Course) => (
        <span className="capitalize">{course.courseLevel.toLowerCase()}</span>
      ),
    },
    {
      accessorKey: 'category' as keyof Course,
      header: 'Category',
      cell: (course: Course) => course.category?.categoryName || 'N/A',
    },
    {
      accessorKey: 'students' as keyof Course,
      header: 'Students',
      cell: (course: Course) => course.students || 0,
    },
    {
      accessorKey: 'batches' as keyof Course,
      header: 'Batches',
      cell: (course: Course) => course.batches || 0,
    },
    {
      accessorKey: 'averageRating' as keyof Course,
      header: 'Rating',
      cell: (course: Course) => (
        <div className="flex items-center">
          <span className="text-amber-500 mr-1">★</span>
          {course.averageRating?.toFixed(1) || 'N/A'}
        </div>
      ),
    },
  ];

  const courseActions = [
    {
      label: 'View',
      onClick: (course: Course) => {
        window.location.href = `/courses/${course.id}`;
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
          <Button onClick={handleCreateCourse}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
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
                    <SelectItem key={category.id} value={category.id.toString()}>
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
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
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
