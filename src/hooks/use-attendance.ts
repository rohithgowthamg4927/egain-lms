import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/lib/types';
import { AttendanceService } from '@/services/attendance.service';

export function useAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const attendanceService = new AttendanceService();

  const markAttendance = async (scheduleId: number, userId: number, status: string) => {
    try {
      if (!user) throw new Error('Not authenticated');
      if (user.role !== Role.instructor && user.role !== Role.admin) {
        throw new Error('Only instructors and admins can mark attendance');
      }

      const result = await attendanceService.markAttendance(
        scheduleId,
        userId,
        status
      );

      toast({
        title: 'Success',
        description: 'Attendance marked successfully',
      });

      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark attendance',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getScheduleAttendance = async (scheduleId: number) => {
    try {
      if (!user) throw new Error('Not authenticated');

      const result = await attendanceService.getScheduleAttendance(
        scheduleId
      );

      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch attendance',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateAttendance = async (attendanceId: number, status: string) => {
    try {
      if (!user) throw new Error('Not authenticated');
      if (user.role !== Role.instructor && user.role !== Role.admin) {
        throw new Error('Only instructors and admins can update attendance');
      }

      const result = await attendanceService.updateAttendance(
        attendanceId,
        status
      );

      toast({
        title: 'Success',
        description: 'Attendance updated successfully',
      });

      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update attendance',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteAttendance = async (attendanceId: number) => {
    try {
      if (!user) throw new Error('Not authenticated');
      if (user.role !== Role.instructor && user.role !== Role.admin) {
        throw new Error('Only instructors and admins can delete attendance');
      }

      const result = await attendanceService.deleteAttendance(
        attendanceId
      );

      toast({
        title: 'Success',
        description: 'Attendance deleted successfully',
      });

      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete attendance',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    markAttendance,
    getScheduleAttendance,
    updateAttendance,
    deleteAttendance,
  };
} 