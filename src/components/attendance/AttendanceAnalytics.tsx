
import { useState } from 'react';
import { useAttendance } from '@/hooks/use-attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { CalendarClock, Users, Medal, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface AttendanceAnalyticsProps {
  userId?: number;
  batchId?: number;
}

const AttendanceAnalytics = ({ userId, batchId }: AttendanceAnalyticsProps) => {
  const { user } = useAuth();
  const { useStudentAttendanceAnalytics, useBatchAttendanceAnalytics } = useAttendance();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use the appropriate analytics hook based on props
  const studentAnalyticsQuery = useStudentAttendanceAnalytics(userId || null);
  const batchAnalyticsQuery = useBatchAttendanceAnalytics(batchId || null);
  
  const isLoading = studentAnalyticsQuery.isLoading || batchAnalyticsQuery.isLoading;
  const isError = studentAnalyticsQuery.isError || batchAnalyticsQuery.isError;
  
  const studentData = userId ? studentAnalyticsQuery.data?.data : null;
  const batchData = batchId ? batchAnalyticsQuery.data?.data : null;
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">
            Failed to load attendance analytics.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render student attendance data
  if (userId && studentData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{studentData.overall.percentage}%</div>
              <Progress value={studentData.overall.percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Based on {studentData.overall.total} classes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Classes Attended</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1">
                <div className="text-3xl font-bold">{studentData.overall.present}</div>
                <div className="text-muted-foreground mb-1">/ {studentData.overall.total}</div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Present: {studentData.overall.present}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Late: {studentData.overall.late}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Absent: {studentData.overall.absent}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Attendance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentData.overall.percentage >= 75 ? (
                  <div className="flex items-center text-green-500">
                    <Medal className="h-5 w-5 mr-1" />
                    Good
                  </div>
                ) : studentData.overall.percentage >= 60 ? (
                  <div className="flex items-center text-yellow-500">
                    <AlertCircle className="h-5 w-5 mr-1" />
                    Warning
                  </div>
                ) : (
                  <div className="flex items-center text-red-500">
                    <XCircle className="h-5 w-5 mr-1" />
                    Critical
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {studentData.overall.percentage >= 75
                  ? "You're doing great! Keep up the good attendance."
                  : studentData.overall.percentage >= 60
                  ? "Your attendance needs improvement. Try to attend more classes."
                  : "Your attendance is critically low. Please contact your instructor."}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Batch Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentData.byBatch.map((batch) => (
                <div key={batch.batchId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{batch.batchName}</div>
                    <div className="text-sm">
                      <span className="font-semibold">{batch.percentage}%</span> ({batch.present}/{batch.total} classes)
                    </div>
                  </div>
                  <Progress value={batch.percentage} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Present: {batch.present}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-yellow-500" />
                      Late: {batch.late}
                    </div>
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      Absent: {batch.absent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render batch attendance data
  if (batchId && batchData) {
    return (
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{batchData.overall.percentage}%</div>
                  <Progress value={batchData.overall.percentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Batch Average
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Class Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5" />
                    <div className="text-2xl font-bold">{batchData.totalClasses}</div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total Classes
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {batchData.totalStudents} students enrolled
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Present</span>
                    </div>
                    <span>{batchData.overall.present} ({Math.round((batchData.overall.present / batchData.overall.total) * 100)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Late</span>
                    </div>
                    <span>{batchData.overall.late} ({Math.round((batchData.overall.late / batchData.overall.total) * 100)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Absent</span>
                    </div>
                    <span>{batchData.overall.absent} ({Math.round((batchData.overall.absent / batchData.overall.total) * 100)}%)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pt-1">
                  <div className="text-sm mb-1">Attendance Distribution</div>
                  <div className="flex h-5 overflow-hidden text-xs rounded-md">
                    <div 
                      style={{ width: `${(batchData.overall.present / batchData.overall.total) * 100}%` }}
                      className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                    ></div>
                    <div 
                      style={{ width: `${(batchData.overall.late / batchData.overall.total) * 100}%` }}
                      className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                    ></div>
                    <div 
                      style={{ width: `${(batchData.overall.absent / batchData.overall.total) * 100}%` }}
                      className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {batchData.students.map((student) => (
                    <div key={student.userId} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{student.fullName}</div>
                        <div className="text-sm">
                          <span className="font-semibold">{student.percentage}%</span> 
                          ({student.present}/{student.total} classes)
                        </div>
                      </div>
                      <Progress value={student.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <CardTitle>Class Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  <CalendarClock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>Class-specific attendance details will be available soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  return (
    <Card>
      <CardContent className="py-6">
        <div className="text-center text-muted-foreground">
          Select a student or batch to view attendance analytics.
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceAnalytics;
