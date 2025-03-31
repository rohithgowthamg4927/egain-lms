
import { Course } from '@/lib/types';
import CourseCard from './CourseCard';

interface CourseGridProps {
  courses: Course[];
  loading?: boolean;
  onView?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
}

const CourseGrid = ({ 
  courses, 
  loading = false, 
  onView, 
  onEdit, 
  onDelete 
}: CourseGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="bg-card rounded-lg border shadow animate-pulse h-[350px]"
          />
        ))}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No courses found</h3>
        <p className="text-muted-foreground mt-2">
          Try adjusting your filters or add a new course.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {courses.map((course) => (
        <CourseCard 
          key={course.courseId} 
          course={course} 
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CourseGrid;
