
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Pencil,
  Users,
  Calendar,
  Star,
  Layers,
  BarChart,
  Clock,
} from 'lucide-react';
import { Course, Batch, Role } from '@/lib/types';
import { getCourseById } from '@/lib/api';
import { EntityAdapter } from '@/lib/adapters/entity-adapter';
import BatchList from '@/components/batches/BatchList';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';
import { useAuth } from '@/hooks/use-auth';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      setLoading(true);
      try {
        const response = await getCourseById(parseInt(courseId));
        if (response.success && response.data) {
          setCourse(EntityAdapter.adaptCourse(response.data));
        } else {
          setError(response.error || 'Failed to fetch course details');
          toast({
            title: 'Error',
            description: response.error || 'Failed to fetch course details',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError('An error occurred while fetching course details');
        toast({
          title: 'Error',
          description: 'An error occurred while fetching course details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-700 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">Error</h2>
        <p className="text-gray-600 mt-2">{error || 'Course not found'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  const renderBatches = () => {
    const batches = course.batches || [];
    if (!batches.length) {
      return (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No batches available for this course.</p>
        </div>
      );
    }

    return <BatchList batches={batches as Batch[]} />;
  };

  const renderReviews = () => {
    const reviews = course.reviews || [];
    if (!reviews.length) {
      return (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No reviews available for this course.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.reviewId} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">
                    {review.user?.fullName || 'Anonymous'}
                  </h3>
                  <div className="flex items-center mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-sm">
                {review.review || 'No written review provided.'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: 'Courses', link: '/courses' },
          { label: course.courseName, link: `/courses/${course.courseId}` },
        ]}
      />

      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{course.courseName}</h1>
          <p className="text-muted-foreground mt-1">
            {course.description || 'No description available.'}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => navigate(`/courses/edit/${course.courseId}`)}
            className="self-start"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {course._count?.studentCourses || 0}
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Course Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold capitalize">
                {course.courseLevel}
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">
                {course._count?.batches || 0}
              </span>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 border-b">
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                  selected
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`
              }
            >
              Batches
            </Tab>
            {isAdmin && (
              <Tab
                className={({ selected }) =>
                  `px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                    selected
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                  }`
                }
              >
                Reviews
              </Tab>
            )}
          </Tab.List>
          <Tab.Panels className="mt-4">
            <Tab.Panel>{renderBatches()}</Tab.Panel>
            {isAdmin && <Tab.Panel>{renderReviews()}</Tab.Panel>}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default CourseDetail;
