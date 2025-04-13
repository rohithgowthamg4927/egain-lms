import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCourseById } from '@/lib/api/courses';
import { getStudentCourses, enrollStudentInCourse, removeStudentFromCourse } from '@/lib/api/student-courses';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BookOpen, Calendar, Clock, Users, Star, GraduationCap, FileText, CheckCircle, Calendar as CalendarIcon, BookMarked } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { Level } from '@/lib/types';

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: course, isLoading: isCourseLoading, error: courseError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseById(Number(courseId)),
    enabled: !!courseId,
  });

  const { data: studentCoursesData, isLoading: isStudentCoursesLoading } = useQuery({
    queryKey: ['studentCourses', user?.userId],
    queryFn: () => getStudentCourses(user?.userId || 0),
    enabled: !!user?.userId,
  });

  useEffect(() => {
    if (studentCoursesData?.success && studentCoursesData.data && courseId) {
      const enrolled = studentCoursesData.data.some(
        sc => sc.course.courseId === Number(courseId)
      );
    }
  }, [studentCoursesData, courseId]);

  const getLevelLabel = (level: Level) => {
    const levelMap = {
      [Level.beginner]: 'Beginner',
      [Level.intermediate]: 'Intermediate',
      [Level.advanced]: 'Advanced'
    };
    return levelMap[level] || level;
  };

  const getLevelColor = (level: Level) => {
    const colorMap = {
      [Level.beginner]: 'bg-green-100 text-green-800',
      [Level.intermediate]: 'bg-blue-100 text-blue-800',
      [Level.advanced]: 'bg-purple-100 text-purple-800'
    };
    return colorMap[level] || 'bg-gray-100 text-gray-800';
  };

  if (isCourseLoading || isStudentCoursesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (courseError || !course?.data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading course details. Please try again later.</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => navigate('/student/courses')}
        >
          Back to Courses
        </Button>
      </div>
    );
  }

  const courseData = course.data;

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: 'My Courses', link: '/student/courses' },
          { label: courseData.courseName, link: `/student/courses/${courseId}` },
        ]}
      />

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{courseData.courseName}</h1>
            <Badge className={getLevelColor(courseData.courseLevel)}>
              {getLevelLabel(courseData.courseLevel)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">{courseData.category?.categoryName || 'Uncategorized'}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <div>
          <Card className="border-blue-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
              <CardTitle>Course Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{courseData.description || 'No description available.'}</p>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="border-purple-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Level: {getLevelLabel(courseData.courseLevel)}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Category: {courseData.category?.categoryName || 'Uncategorized'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Students: {courseData._count?.studentCourses || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Batches: {courseData._count?.batches || 0}</span>
              </div>
              <div className="pt-4 border-t border-purple-100">
                <h4 className="text-sm font-medium mb-2">Instructors</h4>
                <div className="space-y-2">
                  {courseData.instructorCourses && courseData.instructorCourses.length > 0 ? (
                    courseData.instructorCourses.map((instructorCourse) => {
                      const nameParts = instructorCourse.instructor.fullName.split(' ');
                      const initials = nameParts.length >= 2 
                        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
                        : instructorCourse.instructor.fullName.slice(0, 2);
                      
                      return (
                        <div key={instructorCourse.instructor.userId} className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-purple-100">
                            <AvatarImage src={instructorCourse.instructor.photoUrl} />
                            <AvatarFallback className="bg-purple-100 text-purple-700">{initials.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{instructorCourse.instructor.fullName}</p>
                            <p className="text-xs text-muted-foreground">{instructorCourse.instructor.bio || 'Course Instructor'}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No instructors assigned</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <Button 
          onClick={() => navigate('/student/courses')}
          variant="outline"
        >
          Back to My Courses
        </Button>
      </div>
    </div>
  );
}
