
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
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch course details
  const { data: course, isLoading: isCourseLoading, error: courseError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourseById(Number(courseId)),
    enabled: !!courseId,
  });

  // Fetch student courses to check enrollment status
  const { data: studentCoursesData, isLoading: isStudentCoursesLoading } = useQuery({
    queryKey: ['studentCourses', user?.userId],
    queryFn: () => getStudentCourses(user?.userId || 0),
    enabled: !!user?.userId,
  });

  // Check if student is enrolled in this course
  useEffect(() => {
    if (studentCoursesData?.success && studentCoursesData.data && courseId) {
      const enrolled = studentCoursesData.data.some(
        sc => sc.course.courseId === Number(courseId)
      );
      setIsEnrolled(enrolled);
    }
  }, [studentCoursesData, courseId]);

  const handleEnroll = async () => {
    if (!user?.userId || !courseId) return;
    
    setIsEnrolling(true);
    try {
      const response = await enrollStudentInCourse(user.userId, Number(courseId));
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'You have successfully enrolled in this course',
        });
        setIsEnrolled(true);
      } else {
        throw new Error(response.error || 'Failed to enroll in course');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to enroll in course',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!user?.userId || !courseId) return;
    
    setIsUnenrolling(true);
    try {
      const response = await removeStudentFromCourse(user.userId, Number(courseId));
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'You have been unenrolled from this course',
        });
        setIsEnrolled(false);
        setShowUnenrollDialog(false);
      } else {
        throw new Error(response.error || 'Failed to unenroll from course');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unenroll from course',
        variant: 'destructive',
      });
    } finally {
      setIsUnenrolling(false);
    }
  };

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
        
        {isEnrolled ? (
          <Button 
            variant="outline" 
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => setShowUnenrollDialog(true)}
            disabled={isUnenrolling}
          >
            {isUnenrolling ? 'Unenrolling...' : 'Unenroll from Course'}
          </Button>
        ) : (
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleEnroll}
            disabled={isEnrolling}
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll in Course'}
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          {isEnrolled && (
            <TabsTrigger value="materials">Materials</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Course Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{courseData.description || 'No description available.'}</p>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Level: {getLevelLabel(courseData.courseLevel)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Students: {courseData._count?.studentCourses || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Resources: {courseData._count?.resources || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Schedules: {courseData._count?.schedules || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="content" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
            </CardHeader>
            <CardContent>
              {courseData.batches && courseData.batches.length > 0 ? (
                <div className="space-y-4">
                  {courseData.batches.map((batch, index) => (
                    <div key={batch.batchId} className="border rounded-md p-4">
                      <h3 className="font-medium text-lg">{batch.batchName || `Batch ${index + 1}`}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{batch.description || 'No description available.'}</p>
                      
                      {batch.schedules && batch.schedules.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          <h4 className="text-sm font-medium">Schedule:</h4>
                          {batch.schedules.slice(0, 3).map(schedule => (
                            <div key={schedule.scheduleId} className="flex items-center gap-2 text-sm">
                              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                              <span>{schedule.title}: {format(new Date(schedule.scheduleDate), 'PPP')}</span>
                            </div>
                          ))}
                          {batch.schedules.length > 3 && (
                            <p className="text-xs text-muted-foreground">+ {batch.schedules.length - 3} more schedules</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-3">No schedules available.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No curriculum information available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {isEnrolled && (
          <TabsContent value="materials" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Materials</CardTitle>
              </CardHeader>
              <CardContent>
                {courseData.resources && courseData.resources.length > 0 ? (
                  <div className="space-y-4">
                    {courseData.resources.map(resource => (
                      <div key={resource.resourceId} className="flex items-center justify-between border rounded-md p-4">
                        <div className="flex items-center gap-3">
                          <BookMarked className="h-5 w-5 text-blue-500" />
                          <div>
                            <h3 className="font-medium">{resource.title}</h3>
                            <p className="text-sm text-muted-foreground">{resource.description || 'No description'}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <a href={resource.resourceUrl} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No course materials available yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {activeTab === 'overview' && isEnrolled && courseData.reviews && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Student Reviews</h2>
          
          {courseData.reviews.length > 0 ? (
            <div className="space-y-4">
              {courseData.reviews.map(review => (
                <Card key={review.reviewId}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback>{review.user?.fullName?.slice(0, 2) || 'ST'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="font-medium">{review.user?.fullName || 'Student'}</h3>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(review.createdAt), 'PPP')}
                        </p>
                        {review.review && (
                          <p className="mt-2">{review.review}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No reviews yet. Be the first to review this course!</p>
          )}
          
          <div className="mt-4">
            <Button 
              onClick={() => navigate('/student/courses')}
              variant="outline"
            >
              Back to My Courses
            </Button>
          </div>
        </div>
      )}

      {/* Unenroll Confirmation Dialog */}
      <AlertDialog open={showUnenrollDialog} onOpenChange={setShowUnenrollDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to unenroll?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to all course materials and your progress may be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnenroll}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isUnenrolling}
            >
              {isUnenrolling ? 'Unenrolling...' : 'Unenroll'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
