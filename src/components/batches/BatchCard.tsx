
import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Users, ChevronRight, Edit, Trash, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Batch } from '@/lib/types';

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
  
  const startDate = new Date(batch.startDate);
  const endDate = new Date(batch.endDate);
  
  const courseName = batch.course?.courseName || 'Unknown Course';
  const instructor = batch.instructor?.fullName || 'Unassigned';
  const studentsCount = batch.students?.length || 0;
  
  const batchStatus = () => {
    const today = new Date();
    if (today < startDate) return { label: 'Upcoming', variant: 'outline' as const };
    if (today > endDate) return { label: 'Completed', variant: 'secondary' as const };
    return { label: 'Active', variant: 'default' as const };
  };
  
  const { label, variant } = batchStatus();

  const handleViewBatch = () => {
    if (onView) {
      onView(batch);
    }
  };

  const handleEditBatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(batch);
    }
  };

  const handleDeleteBatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(batch);
    }
  };

  const handleManageStudents = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onManageStudents) {
      onManageStudents(batch);
    }
  };
  
  return (
    <Card 
      className={`hover:shadow-md transition-all duration-200 cursor-pointer ${isHovered ? 'border-primary/50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleViewBatch}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold line-clamp-1">{batch.batchName}</CardTitle>
            <CardDescription className="text-sm font-medium line-clamp-1">{courseName}</CardDescription>
          </div>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">
              {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>
              {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                  <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>{studentsCount} students</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{studentsCount} students enrolled</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="text-muted-foreground truncate max-w-[150px]">
            <span className="font-medium text-foreground">{instructor}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="grid grid-cols-1 gap-2 pt-2">
        <div className="flex justify-between gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleEditBatch}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleManageStudents}
            className="flex-1"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Students
          </Button>
        </div>
        <Button 
          variant="default"
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700"
          onClick={handleViewBatch}
        >
          View Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BatchCard;
