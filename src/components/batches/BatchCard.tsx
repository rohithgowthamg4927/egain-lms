
import { useState } from 'react';
import { Batch } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Users, Calendar, Edit, Trash, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { getCourseName, getInstructorName } from '@/lib/utils/entity-helpers';

interface BatchCardProps {
  batch: Batch;
  onView?: (batch: Batch) => void;
  onEdit?: (batch: Batch) => void;
  onDelete?: (batch: Batch) => void;
  onManageStudents?: (batch: Batch) => void;
}

const BatchCard = ({ 
  batch,
  onView,
  onEdit,
  onDelete,
  onManageStudents
}: BatchCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleViewClick = () => {
    if (onView) {
      onView(batch);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(batch);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(batch);
    }
  };

  const handleManageStudentsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onManageStudents) {
      onManageStudents(batch);
    }
  };

  // Format dates
  const startDate = new Date(batch.startDate);
  const endDate = new Date(batch.endDate);

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 h-full flex flex-col relative ${
        isHovered ? 'shadow-lg translate-y-[-4px]' : 'shadow'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full pt-[30%] bg-primary/10">
        <div className="absolute inset-0 flex items-center justify-center">
          <Calendar className="h-12 w-12 text-primary opacity-40" />
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-lg">{batch.batchName}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {getCourseName(batch.course, batch.courseId)}
        </p>
      </CardHeader>

      <CardContent className="pb-4 flex-grow">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Instructor:</span>
            <span className="text-sm font-medium">{getInstructorName(batch.instructor, batch.instructorId)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Period:</span>
            <span className="text-sm">
              {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Students:</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{batch.studentsCount || 0}</span>
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex flex-col gap-2">
        <Button
          variant="default"
          className="w-full gap-2 group"
          onClick={handleViewClick}
        >
          <Eye className="h-4 w-4" />
          View Batch
        </Button>
        
        <div className="grid grid-cols-3 w-full gap-2">
          <Button
            variant="outline"
            onClick={handleManageStudentsClick}
            title="Manage Students"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleEditClick}
            title="Edit Batch"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
            title="Delete Batch"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BatchCard;
