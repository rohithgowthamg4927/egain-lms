import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Users, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Batch } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@/lib/types';

interface BatchCardProps {
  batch: Batch;
  onView?: (batch: Batch) => void;
  onEdit?: (batch: Batch) => void;
  onDelete?: (batch: Batch) => void;
  onManageStudents?: (batch: Batch) => void;
  onInstructorClick?: (instructorId: number) => void;
}

const BatchCard = ({ 
  batch, 
  onView, 
  onEdit, 
  onDelete, 
  onManageStudents,
  onInstructorClick 
}: BatchCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  
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

  const handleInstructorClick = () => {
    if (onInstructorClick && batch.instructorId && isAdmin) {
      onInstructorClick(batch.instructorId);
    }
  };
  
  return (
    <Card 
      className={`hover:shadow-md transition-all duration-200 ${isHovered ? 'border-primary/50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{batch.batchName}</CardTitle>
            <CardDescription className="text-sm">{courseName}</CardDescription>
          </div>
          <Badge variant={variant}>{label}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-2" />
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
                  <Users className="h-4 w-4 mr-1" />
                  <span>{studentsCount} students</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{studentsCount} students enrolled</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div 
            className={`text-muted-foreground ${isAdmin ? 'cursor-pointer hover:text-foreground transition-colors' : ''}`}
            onClick={handleInstructorClick}
          >
            Instructor: <span className="font-medium text-foreground">{instructor}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="default"
          size="sm"
          className="w-full"
          onClick={handleViewBatch}
        >
          View Batch
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BatchCard;
