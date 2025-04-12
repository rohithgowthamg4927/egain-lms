
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  GraduationCap,
  Users,
  User
} from 'lucide-react';
import { Batch, Role } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const getBatchStatus = () => {
    const now = new Date();
    const startDate = new Date(batch.startDate);
    const endDate = new Date(batch.endDate);

    if (now < startDate) {
      return {
        label: 'Upcoming',
        class: 'bg-yellow-100 text-yellow-800',
      };
    } else if (now > endDate) {
      return {
        label: 'Completed',
        class: 'bg-gray-100 text-gray-800',
      };
    } else {
      return {
        label: 'In Progress',
        class: 'bg-green-100 text-green-800',
      };
    }
  };

  const status = getBatchStatus();

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg">{batch.batchName}</h3>
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.class}`}
          >
            {status.label}
          </span>
        </div>

        <div className="mb-3">
          <div className="text-sm font-medium">{batch.course?.courseName}</div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
            </span>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4 mr-2" />
            <span>
              Instructor:{' '}
              <button
                className="text-blue-600 hover:underline"
                onClick={() => onInstructorClick && batch.instructor?.userId && onInstructorClick(batch.instructor.userId)}
              >
                {batch.instructor?.fullName || 'Unassigned'}
              </button>
            </span>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <span>
              {batch.studentsCount !== undefined
                ? batch.studentsCount
                : batch.students?.length || 0}{' '}
              student{(batch.studentsCount !== 1 && batch.studentsCount !== undefined) ||
              (batch.students?.length !== 1 && batch.students !== undefined)
                ? 's'
                : ''}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onView && onView(batch)}
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
              <DropdownMenuItem
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit && onEdit(batch);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setIsMenuOpen(false);
                  onManageStudents && onManageStudents(batch);
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Manage Students
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete && onDelete(batch);
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

export default BatchCard;
