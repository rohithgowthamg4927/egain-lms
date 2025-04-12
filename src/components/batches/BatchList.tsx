
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Batch } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Pencil, Trash2, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Role } from '@/lib/types';

interface BatchListProps {
  batches: Batch[];
}

const BatchList = ({ batches }: BatchListProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === Role.admin;
  
  const sortedBatches = [...batches].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const getBatchStatus = (batch: Batch) => {
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

  return (
    <div className="space-y-4">
      {sortedBatches.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground">No batches available.</p>
        </div>
      ) : (
        sortedBatches.map((batch) => {
          const status = getBatchStatus(batch);
          return (
            <Card key={batch.batchId} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{batch.batchName}</h3>
                      <Badge className={status.class}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {batch.course?.courseName}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(batch.startDate), 'MMM d, yyyy')} - {format(new Date(batch.endDate), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-1" />
                        {batch.studentsCount || batch.students?.length || 0} students
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {Math.ceil((new Date(batch.endDate).getTime() - new Date(batch.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                    {batch.instructor && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Instructor: </span>
                        <span>{batch.instructor.fullName}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 self-start">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => navigate(`/batches/${batch.batchId}`)}
                    >
                      View Details
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/batches/${batch.batchId}/edit`)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/batches/manage-students?batchId=${batch.batchId}`)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Manage Students
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default BatchList;
