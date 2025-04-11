import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Batch, Schedule } from '@/lib/types';
import { getBatches } from '@/lib/api';
import { getStudentSchedules } from '@/lib/api/students';
import { format } from 'date-fns';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';
import BreadcrumbNav from '@/components/layout/BreadcrumbNav';

export default function StudentSchedules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchSchedules(selectedBatch);
    } else {
      setSchedules([]);
      setIsLoading(false);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const response = await getBatches();
      if (response.success && response.data) {
        setBatches(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch batches');
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch batches',
        variant: 'destructive',
      });
    }
  };

  const fetchSchedules = async (batchId: string) => {
    setIsLoading(true);
    try {
      const response = await getStudentSchedules(user?.userId.toString() || '');
      if (response.success && response.data) {
        setSchedules(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch schedules');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch schedules',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSchedules = schedules.filter(schedule => 
    !selectedBatch || schedule.batchId.toString() === selectedBatch
  );

  const upcomingSchedules = filteredSchedules.filter(
    schedule => new Date(schedule.scheduleDate) >= new Date()
  );

  const pastSchedules = filteredSchedules.filter(
    schedule => new Date(schedule.scheduleDate) < new Date()
  );

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Schedules', link: '/student/schedules' }
      ]} />
      <h1 className="text-3xl font-bold">Schedules</h1>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-muted-foreground">
          View your upcoming and past class schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full sm:w-[200px] p-2 border rounded-md"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.batchId} value={batch.batchId.toString()}>
                  {batch.batchName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Schedules */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Schedules</h2>
            {upcomingSchedules.length > 0 ? (
              <div className="grid gap-4">
                {upcomingSchedules.map((schedule) => (
                  <Card key={schedule.scheduleId}>
                    <CardHeader>
                      <CardTitle>{schedule.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(schedule.scheduleDate), 'PPP')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(schedule.startTime), 'p')} - {format(new Date(schedule.endTime), 'p')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{schedule.batch.course.courseName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{schedule.batch.batchName}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <h3 className="text-lg font-medium">No upcoming schedules</h3>
                <p className="text-muted-foreground mt-1">
                  {selectedBatch ? 'No upcoming schedules for this batch' : 'No upcoming schedules found'}
                </p>
              </div>
            )}
          </div>

          {/* Past Schedules */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Past Schedules</h2>
            {pastSchedules.length > 0 ? (
              <div className="grid gap-4">
                {pastSchedules.map((schedule) => (
                  <Card key={schedule.scheduleId}>
                    <CardHeader>
                      <CardTitle>{schedule.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(schedule.scheduleDate), 'PPP')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(schedule.startTime), 'p')} - {format(new Date(schedule.endTime), 'p')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{schedule.batch.course.courseName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{schedule.batch.batchName}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
                <h3 className="text-lg font-medium">No past schedules</h3>
                <p className="text-muted-foreground mt-1">
                  {selectedBatch ? 'No past schedules for this batch' : 'No past schedules found'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 