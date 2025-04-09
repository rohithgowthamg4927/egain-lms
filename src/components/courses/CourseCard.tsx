
import { useState } from 'react';
import { Course, Level } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, Bookmark, Edit, Trash } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onView?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
}

const CourseCard = ({ 
  course,
  onView,
  onEdit,
  onDelete 
}: CourseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // For debugging purposes, log the course object
  console.log('CourseCard - rendering course:', course);

  const levelColor = {
    'beginner': 'bg-green-100 hover:bg-green-200 text-green-800',
    'intermediate': 'bg-blue-100 hover:bg-blue-200 text-blue-800',
    'advanced': 'bg-purple-100 hover:bg-purple-200 text-purple-800'
  };

  const handleViewClick = () => {
    console.log('View button clicked for course:', course.courseId);
    if (onView) {
      onView(course);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Edit button clicked for course:', course.courseId);
    if (onEdit) {
      onEdit(course);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Delete button clicked for course:', course.courseId);
    if (onDelete) {
      onDelete(course);
    }
  };

  const getLevelLabel = (level: Level): string => {
    const labels = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };
    return labels[level] || level;
  };

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 h-full flex flex-col relative ${
        isHovered ? 'shadow-lg translate-y-[-4px]' : 'shadow'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full pt-[56.25%] bg-muted">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 flex items-end">
          <div className="p-4 w-full">
            <Badge variant="outline" className={`font-normal ${levelColor[course.courseLevel]}`}>
              {getLevelLabel(course.courseLevel)}
            </Badge>
          </div>
        </div>
        <img
          src={course.thumbnailUrl || '/thumbnail.jpeg'}
          alt={course.courseName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-lg">{course.courseName}</CardTitle>
      </CardHeader>

      <CardContent className="pb-4 flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {course.description || "No description available for this course."}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>{course._count?.studentCourses || 0} students</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Bookmark className="h-4 w-4 mr-1" />
            <span>{course._count?.batches || 0} batches</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex flex-col gap-2">
        <Button
          variant="default"
          className="w-full gap-2 group"
          onClick={handleViewClick}
        >
          <Eye className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          View Course
        </Button>
        
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleEditClick}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDeleteClick}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
