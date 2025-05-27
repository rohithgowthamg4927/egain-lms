import { format } from 'date-fns';
import { Calendar, Clock, Users, Eye, Edit, Trash2, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Batch } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@/lib/types';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import '@/pages/CategoriesTooltip.css';
import { useState } from 'react';

interface BatchListProps {
  batches: Batch[];
  loading?: boolean;
  onView?: (batch: Batch) => void;
  onEdit?: (batch: Batch) => void;
  onDelete?: (batch: Batch) => void;
  onManageStudents?: (batch: Batch) => void;
  onInstructorClick?: (instructorId: number) => void;
}

const BatchList = ({ 
  batches, 
  loading = false, 
  onView, 
  onEdit, 
  onDelete,
  onManageStudents,
  onInstructorClick 
}: BatchListProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  const totalPages = Math.ceil(batches.length / entriesPerPage);
  const paginatedBatches = batches.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-16 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No batches found</h3>
        <p className="text-muted-foreground mt-2">
          Try adjusting your filters or add a new batch.
        </p>
      </div>
    );
  }

  const getBatchStatus = (batch: Batch) => {
    const today = new Date();
    const startDate = new Date(batch.startDate);
    const endDate = new Date(batch.endDate);
    
    if (today < startDate) return { label: 'Upcoming', variant: 'outline' as const };
    if (today > endDate) return { label: 'Completed', variant: 'secondary' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Batch Name</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Instructor</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedBatches.map((batch, index) => {
            const { label, variant } = getBatchStatus(batch);
            const startDate = new Date(batch.startDate);
            const endDate = new Date(batch.endDate);
            const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const studentsCount = batch.students?.length || 0;

            return (
              <TableRow key={batch.batchId}>
                <TableCell className="text-muted-foreground">{(currentPage - 1) * entriesPerPage + index + 1}</TableCell>
                <TableCell className="font-medium">{batch.batchName}</TableCell>
                <TableCell>{batch.course?.courseName || 'N/A'}</TableCell>
                <TableCell>
                  {batch.instructor ? (
                    isAdmin ? (
                      <Button
                        variant="link"
                        className="p-0 h-auto font-normal"
                        onClick={() => onInstructorClick?.(batch.instructorId!)}
                      >
                        {batch.instructor.fullName}
                      </Button>
                    ) : (
                      batch.instructor.fullName
                    )
                  ) : (
                    'Unassigned'
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center text-muted-foreground mt-1">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{duration} days</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{studentsCount} students</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={variant}>{label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Tippy 
                      content={
                        <div className="max-w-xs p-2">
                          <h5 className="font-medium mb-1">View Batch Details</h5>
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
                        onClick={() => onView?.(batch)}
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
                              <p className="font-medium mb-1">Edit Batch</p>
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
                            onClick={() => onEdit?.(batch)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Tippy>
                        <Tippy 
                          content={
                            <div className="max-w-xs p-2">
                              <h5 className="font-medium mb-1">Manage Students</h5>
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
                            onClick={() => onManageStudents?.(batch)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </Tippy>
                        <Tippy 
                          content={
                            <div className="max-w-xs p-2">
                              <h5 className="font-medium mb-1">Delete Batch</h5>
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
                            onClick={() => onDelete?.(batch)}
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
            );
          })}
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

export default BatchList; 