
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getCourses } from '@/lib/api/courses';
import { getStudentCourses } from '@/lib/api/student-courses';
import { useAuth } from '@/hooks/use-auth';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, Users, Search } from 'lucide-react';
import { Level } from '@/lib/types';

const StudentCourses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch all courses
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses
  });
  
  // Fetch enrolled courses
  const enrolledCoursesQuery = useQuery({
    queryKey: ['studentCourses', user?.userId],
    queryFn: () => (user?.userId ? getStudentCourses(user.userId) : Promise.resolve({ success: false, data: [] })),
    enabled: !!user?.userId,
  });
  
  // Format enrolled courses to match the course structure
  const enrolledCourses = enrolledCoursesQuery.data?.data?.map(enrollment => enrollment.course) || [];
  
  // Filter courses based on search query
  const filteredAllCourses = coursesQuery.data?.data?.filter(course => 
    course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category?.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const filteredEnrolledCourses = enrolledCourses.filter(course => 
    course?.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course?.category?.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const isLoading = coursesQuery.isLoading || enrolledCoursesQuery.isLoading;
  
  const getLevelBadge = (level: Level) => {
    const badges: Record<Level, { color: string, label: string }> = {
      'beginner': { color: 'bg-green-100 text-green-800', label: 'Beginner' },
      'intermediate': { color: 'bg-blue-100 text-blue-800', label: 'Intermediate' },
      'advanced': { color: 'bg-purple-100 text-purple-800', label: 'Advanced' }
    };
    
    const { color, label } = badges[level] || { color: '', label: level };
    
    return (
      <Badge className={color}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Courses', link: '/courses' }
      ]} />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Courses</h1>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="enrolled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enrolled">My Courses</TabsTrigger>
          <TabsTrigger value="all">All Courses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="enrolled">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEnrolledCourses.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No courses found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery ? 'Try a different search term' : 'You are not enrolled in any courses yet'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEnrolledCourses.map((course) => (
                <Card 
                  key={course?.courseId} 
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/courses/${course?.courseId}`)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{course?.courseName}</CardTitle>
                        <CardDescription>{course?.category?.categoryName || 'Uncategorized'}</CardDescription>
                      </div>
                      {course?.courseLevel && getLevelBadge(course.courseLevel)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {course?.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center mt-3 text-sm text-gray-600">
                      <div className="flex items-center mr-4">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{course?._count?.studentCourses || 0} students</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{course?._count?.batches || 0} batches</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${course?.courseId}`);
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Course
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAllCourses.length === 0 ? (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No courses found</h3>
              <p className="text-muted-foreground mt-1">
                {searchQuery ? 'Try a different search term' : 'No courses available yet'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAllCourses.map((course) => (
                <Card 
                  key={course.courseId} 
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/courses/${course.courseId}`)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{course.courseName}</CardTitle>
                        <CardDescription>{course.category?.categoryName || 'Uncategorized'}</CardDescription>
                      </div>
                      {course.courseLevel && getLevelBadge(course.courseLevel)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {course.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center mt-3 text-sm text-gray-600">
                      <div className="flex items-center mr-4">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{course._count?.studentCourses || 0} students</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{course._count?.batches || 0} batches</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/${course.courseId}`);
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Course
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentCourses;
