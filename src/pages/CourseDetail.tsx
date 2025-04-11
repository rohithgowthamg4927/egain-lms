import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCourse } from '@/lib/api/courses';
import { format } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Star } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

const CourseDetail = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => getCourse(courseId),
    enabled: !!courseId,
  });

  useEffect(() => {
    if (data && data.success) {
      setCourse(data.data);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  if (!course) {
    return <div>Loading course details...</div>;
  }
  
  const reviewsSection = () => {
    if (!course) return null;
    
    // Check if reviews is an array before accessing length
    const reviewsCount = Array.isArray(course.reviews) ? course.reviews.length : 0;
    
    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Reviews ({reviewsCount})</h3>
        
        {reviewsCount > 0 ? (
          <div className="space-y-4">
            {Array.isArray(course.reviews) && course.reviews.map((review: any) => (
              <div key={review.reviewId} className="p-4 border rounded-lg">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={review.student?.profilePicture || undefined} alt={review.student?.firstName || 'User'} />
                      <AvatarFallback>{getInitials(review.student?.firstName, review.student?.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{review.student?.firstName} {review.student?.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        {review.createdAt ? format(new Date(review.createdAt), 'MMM dd, yyyy') : 'No date'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-2">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No reviews yet</p>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto mt-8 space-y-6">
      <BreadcrumbNav items={[
        { label: 'Courses', link: '/courses' },
        { label: course.courseName, link: `/courses/${courseId}` }
      ]} />
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{course.courseName}</CardTitle>
          <CardDescription>{course.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center space-x-2">
            <Badge>{course.category?.categoryName}</Badge>
          </div>
          <div>
            <h4 className="text-sm font-medium leading-none">Instructor</h4>
            <p className="text-sm text-muted-foreground">
              {course.instructor?.firstName} {course.instructor?.lastName}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium leading-none">Start Date</h4>
            <p className="text-sm text-muted-foreground">
              {format(new Date(course.startDate), 'MMM dd, yyyy')}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium leading-none">End Date</h4>
            <p className="text-sm text-muted-foreground">
              {format(new Date(course.endDate), 'MMM dd, yyyy')}
            </p>
          </div>
        </CardContent>
      </Card>
      {reviewsSection()}
    </div>
  );
};

export default CourseDetail;
