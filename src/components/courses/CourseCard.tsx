
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Course, Level, Role } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';

interface CourseCardProps {
  course: Course;
  onView?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
}

const CourseCard = ({ course, onView, onEdit, onDelete }: CourseCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;

  const getLevelBadgeClass = (level: Level) => {
    switch (level) {
      case Level.beginner:
        return 'bg-green-100 text-green-800';
      case Level.intermediate:
        return 'bg-blue-100 text-blue-800';
      case Level.advanced:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="relative">
        <img
          src={course.thumbnailUrl || '/images/course-placeholder.jpg'}
          alt={course.courseName}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute top-2 right-2">
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getLevelBadgeClass(
              course.courseLevel
            )}`}
          >
            {course.courseLevel.charAt(0).toUpperCase() + course.courseLevel.slice(1)}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.courseName}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
          {course.description || 'No description available.'}
        </p>
        <div className="flex items-center text-sm text-muted-foreground">
          <span className="flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            {course._count?.studentCourses || 0} student{course._count?.studentCourses !== 1 ? 's' : ''}
          </span>
          <span className="mx-2">•</span>
          <span>
            {course._count?.batches || 0} batch{course._count?.batches !== 1 ? 'es' : ''}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onView && onView(course)}
        >
          View Details
        </Button>
        
        {isAdmin && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setIsMenuOpen(false);
                onEdit && onEdit(course);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete && onDelete(course);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
