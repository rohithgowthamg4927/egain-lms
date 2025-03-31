
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course, Level } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, Star, Bookmark } from 'lucide-react';

interface CourseCardProps {
  course: Course;
}

const CourseCard = ({ course }: CourseCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const levelColor = {
    'beginner': 'bg-green-100 hover:bg-green-200 text-green-800',
    'intermediate': 'bg-blue-100 hover:bg-blue-200 text-blue-800',
    'advanced': 'bg-purple-100 hover:bg-purple-200 text-purple-800'
  };

  const viewCourse = () => {
    navigate(`/courses/${course.courseId}`);
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
          src={course.thumbnailUrl || `https://source.unsplash.com/random/600x400?${course.courseName}`}
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
            <span>{course.students || 0} students</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Star className="h-4 w-4 mr-1 text-amber-500" />
            <span>{course.averageRating?.toFixed(1) || "N/A"}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Bookmark className="h-4 w-4 mr-1" />
            <span>{course.batches || 0} batches</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant="default"
          className="w-full gap-2 group"
          onClick={viewCourse}
        >
          <Eye className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          View Course
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
