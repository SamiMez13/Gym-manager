import { Schedule } from './schedule.interface';

export interface DashboardStats {
  totalRevenue: number;
  activeMembers: number;
  todaysClasses: number;
  activeMemberships: number;
  branchCount: number;
  totalMembers: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  todaySchedule: Schedule[];
}
