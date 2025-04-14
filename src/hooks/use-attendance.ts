
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Role, Status } from '@/lib/types';
import { AttendanceService, AttendanceRecord, AttendanceAnalytics } from '@/services/attendance.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useAttendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const attendanceService = new AttendanceService();

  const markAttendance = async (scheduleId: number, userId: number, status: Status) => {
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

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['scheduleAttendance', scheduleId] });
      
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

  const markBulkAttendance = async (scheduleId: number, attendanceRecords: { userId: number; status: Status }[]) => {
    try {
      if (!user) throw new Error('Not authenticated');
      if (user.role !== Role.instructor && user.role !== Role.admin) {
        throw new Error('Only instructors and admins can mark attendance');
      }

      const result = await attendanceService.markBulkAttendance(
        scheduleId,
        attendanceRecords
      );

      toast({
        title: 'Success',
        description: 'Attendance marked successfully for all students',
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['scheduleAttendance', scheduleId] });
      
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

  const useScheduleAttendance = (scheduleId: number | null) => {
    return useQuery({
      queryKey: ['scheduleAttendance', scheduleId],
      queryFn: () => {
        if (!scheduleId) throw new Error('Schedule ID is required');
        return attendanceService.getScheduleAttendance(scheduleId);
      },
      enabled: !!scheduleId && !!user,
    });
  };

  const useStudentAttendanceAnalytics = (userId: number | null) => {
    return useQuery({
      queryKey: ['studentAttendanceAnalytics', userId],
      queryFn: () => {
        if (!userId) throw new Error('User ID is required');
        return attendanceService.getStudentAttendanceAnalytics(userId);
      },
      enabled: !!userId && !!user,
    });
  };

  const useBatchAttendanceAnalytics = (batchId: number | null) => {
    return useQuery({
      queryKey: ['batchAttendanceAnalytics', batchId],
      queryFn: () => {
        if (!batchId) throw new Error('Batch ID is required');
        return attendanceService.getBatchAttendanceAnalytics(batchId);
      },
      enabled: !!batchId && !!user && (user.role === Role.admin || user.role === Role.instructor),
    });
  };

  const updateAttendance = async (attendanceId: number, status: Status) => {
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

  const useMarkAttendanceMutation = () => {
    return useMutation({
      mutationFn: ({ scheduleId, userId, status }: { scheduleId: number; userId: number; status: Status }) => 
        markAttendance(scheduleId, userId, status),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['scheduleAttendance', variables.scheduleId] });
      }
    });
  };

  const useMarkBulkAttendanceMutation = () => {
    return useMutation({
      mutationFn: ({ scheduleId, attendanceRecords }: { scheduleId: number; attendanceRecords: { userId: number; status: Status }[] }) => 
        markBulkAttendance(scheduleId, attendanceRecords),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['scheduleAttendance', variables.scheduleId] });
      }
    });
  };

  const useUpdateAttendanceMutation = () => {
    return useMutation({
      mutationFn: ({ attendanceId, status, scheduleId }: { attendanceId: number; status: Status; scheduleId: number }) => 
        updateAttendance(attendanceId, status),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['scheduleAttendance', variables.scheduleId] });
      }
    });
  };

  const useDeleteAttendanceMutation = () => {
    return useMutation({
      mutationFn: ({ attendanceId, scheduleId }: { attendanceId: number; scheduleId: number }) => 
        deleteAttendance(attendanceId),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['scheduleAttendance', variables.scheduleId] });
      }
    });
  };

  return {
    // Direct methods
    markAttendance,
    markBulkAttendance,
    getScheduleAttendance,
    updateAttendance,
    deleteAttendance,
    
    // React Query hooks
    useScheduleAttendance,
    useStudentAttendanceAnalytics,
    useBatchAttendanceAnalytics,
    
    // Mutations
    useMarkAttendanceMutation,
    useMarkBulkAttendanceMutation,
    useUpdateAttendanceMutation,
    useDeleteAttendanceMutation
  };
}
