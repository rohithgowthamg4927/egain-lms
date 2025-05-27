import { Course } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Users, Bookmark, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@/lib/types';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import '@/pages/CategoriesTooltip.css';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useState } from 'react';

interface CourseListProps {
  courses: Course[];
  onView?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
}

const CourseList = ({ 
  courses, 
  onView, 
  onEdit, 
  onDelete 
}: CourseListProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  const totalPages = Math.ceil(courses.length / entriesPerPage);
  const paginatedCourses = courses.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const levelColor = {
    'beginner': 'bg-green-100 hover:bg-green-200 text-green-800',
    'intermediate': 'bg-blue-100 hover:bg-blue-200 text-blue-800',
    'advanced': 'bg-purple-100 hover:bg-purple-200 text-purple-800'
  };

  const getLevelLabel = (level: string): string => {
    const labels = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };
    return labels[level] || level;
  };

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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Course Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Batches</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedCourses.map((course, index) => (
            <TableRow key={course.courseId}>
              <TableCell className="text-muted-foreground">{(currentPage - 1) * entriesPerPage + index + 1}</TableCell>
              <TableCell className="font-medium">{course.courseName}</TableCell>
              <TableCell>{course.category?.categoryName || 'Uncategorized'}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`font-normal ${levelColor[course.courseLevel]}`}>
                  {getLevelLabel(course.courseLevel)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{course._count?.studentCourses || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center text-muted-foreground">
                  <Bookmark className="h-4 w-4 mr-2" />
                  <span>{course._count?.batches || 0}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Tippy 
                    content={
                      <div className="max-w-xs p-2">
                        <h5 className="font-medium mb-1">View Course Details</h5>
                      </div>
                    }
                    className="custom-tooltip-bg"
                    placement="top"
                    animation="scale"
                    duration={[100, 100]}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView?.(course)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Tippy>
                  {isAdmin && (
                    <>
                      <Tippy 
                        content={
                          <div className="max-w-xs p-2">
                            <h5 className="font-medium mb-1">Edit Course</h5>
                          </div>
                        }
                        className="custom-tooltip-bg"
                        placement="top"
                        animation="scale"
                        duration={[100, 100]}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit?.(course)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Tippy>
                      <Tippy 
                        content={
                          <div className="max-w-xs p-2">
                            <h5 className="font-medium mb-1">Delete Course</h5>
                          </div>
                        }
                        className="custom-tooltip-bg"
                        placement="top"
                        animation="scale"
                        duration={[100, 100]}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete?.(course)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Tippy>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous Page"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i + 1}
              variant={currentPage === i + 1 ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setCurrentPage(i + 1)}
              aria-label={`Page ${i + 1}`}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next Page"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CourseList; 