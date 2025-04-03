
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarCell, CalendarGrid, CalendarHeader, CalendarHeading, CalendarNextButton, CalendarPrevButton, CalendarTitle, Calendar as CalendarRoot } from '@/components/ui/calendar';
import { Batch } from '@/lib/types';
import { getBatches } from '@/lib/api';
import { Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';

const Schedules = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      setIsLoading(true);
      try {
        const response = await getBatches();
        if (response.success && response.data) {
          setBatches(response.data);
          if (response.data.length > 0) {
            setSelectedBatchId(response.data[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatches();
  }, []);

  const selectedBatch = batches.find(batch => batch.id.toString() === selectedBatchId);

  // Mock events for the selected batch
  const events = selectedBatch ? [
    {
      id: 1,
      title: `${selectedBatch.course?.title || 'Class'} - Session 1`,
      start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
      end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 30),
      batchId: selectedBatch.id,
    },
    {
      id: 2,
      title: `${selectedBatch.course?.title || 'Class'} - Session 2`,
      start: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2, 9, 0),
      end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2, 10, 30),
      batchId: selectedBatch.id,
    },
    {
      id: 3,
      title: `${selectedBatch.course?.title || 'Class'} - Session 3`,
      start: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 4, 9, 0),
      end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 4, 10, 30),
      batchId: selectedBatch.id,
    },
  ] : [];

  // This would be replaced with actual logic to get events for the specific day
  const getDayEvents = (day: Date) => {
    return events.filter(event => 
      event.start.getDate() === day.getDate() && 
      event.start.getMonth() === day.getMonth() &&
      event.start.getFullYear() === day.getFullYear()
    );
  };

  const renderEventCard = (event: any) => (
    <Card key={event.id} className="mb-3 border-l-4 border-l-primary">
      <CardContent className="p-4">
        <h3 className="font-medium text-sm">{event.title}</h3>
        <div className="mt-2 flex items-center text-xs text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          <span>{format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}</span>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading schedules...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Schedules</h1>
          <p className="text-muted-foreground">View and manage your course schedules</p>
        </div>
        <div className="w-full md:w-64">
          <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map(batch => (
                <SelectItem key={batch.id} value={batch.id.toString()}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedBatch && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedBatch.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedBatch.course?.title}
                </p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{selectedBatch.instructor?.fullName || 'No instructor assigned'}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{selectedBatch.timings || 'No timings set'}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{selectedBatch.location || 'No location set'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="week" value={view} onValueChange={(v) => setView(v as 'day' | 'week' | 'month')}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="day" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>{format(date, 'EEEE, MMMM d, yyyy')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getDayEvents(date).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No events scheduled for this day</p>
                ) : (
                  getDayEvents(date).map(event => renderEventCard(event))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          {/* Week view implementation */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Week of {format(date, 'MMMM d, yyyy')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => {
                  const day = new Date(date);
                  day.setDate(day.getDate() - day.getDay() + i);
                  
                  return (
                    <div key={i} className="border rounded-md p-2">
                      <div className="text-center mb-2">
                        <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                        <div className={`text-sm font-medium ${
                          day.toDateString() === new Date().toDateString() ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mx-auto' : ''
                        }`}>
                          {format(day, 'd')}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {getDayEvents(day).map(event => (
                          <div 
                            key={event.id} 
                            className="text-xs p-1 bg-primary/10 text-primary rounded truncate"
                            title={event.title}
                          >
                            {format(event.start, 'h:mm a')} - {event.title.substring(0, 10)}...
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <CalendarRoot
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="w-full border-none"
                disabled={{ before: new Date(2023, 0, 1) }}
              >
                <CalendarHeader className="px-4 py-2">
                  <CalendarTitle className="text-base font-semibold" />
                  <div className="flex items-center gap-2">
                    <CalendarPrevButton />
                    <CalendarNextButton />
                  </div>
                </CalendarHeader>
                <CalendarGrid>
                  <CalendarHeading className="p-1" />
                  <CalendarCell className="p-2 relative" />
                </CalendarGrid>
              </CalendarRoot>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Schedules;
