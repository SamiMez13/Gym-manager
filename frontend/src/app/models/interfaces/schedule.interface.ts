export interface Schedule {
  id: number;
  classId: number;
  trainerId: number;
  branchId: number;
  startTime: string;
  endTime: string;
  currentBookings: number;
  maxCapacity: number;
  className?: string;
  trainerName?: string;
  branchName?: string;
}

export type ScheduleCreate = Omit<Schedule, 'id' | 'currentBookings' | 'className' | 'trainerName' | 'branchName'>;
export type ScheduleUpdate = Partial<ScheduleCreate>;
