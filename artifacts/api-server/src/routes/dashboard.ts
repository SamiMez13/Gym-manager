import { Router, type IRouter } from "express";
import { sql, gte, and } from "drizzle-orm";
import {
  db,
  membersTable,
  trainersTable,
  gymClassesTable,
  classSchedulesTable,
  bookingsTable,
  membershipPlansTable,
  membershipsTable,
  paymentsTable,
  branchesTable,
} from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetDashboardRecentActivityResponse,
  GetDashboardClassUtilizationResponse,
  GetDashboardRevenueSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [
    memberStats,
    trainerCount,
    classCount,
    branchCount,
    scheduledToday,
    bookingsToday,
    totalRevenue,
    monthRevenue,
    activeMemberships,
  ] = await Promise.all([
    db.select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where is_active = true)::int`,
    }).from(membersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(trainersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(gymClassesTable),
    db.select({ count: sql<number>`count(*)::int` }).from(branchesTable),
    db.select({ count: sql<number>`count(*)::int` }).from(classSchedulesTable)
      .where(and(gte(classSchedulesTable.startTime, todayStart), sql`${classSchedulesTable.startTime} < ${todayEnd}`)),
    db.select({ count: sql<number>`count(*)::int` }).from(bookingsTable)
      .where(gte(bookingsTable.createdAt, todayStart)),
    db.select({ total: sql<number>`coalesce(sum(amount::numeric), 0)` }).from(paymentsTable)
      .where(sql`status = 'completed'`),
    db.select({ total: sql<number>`coalesce(sum(amount::numeric), 0)` }).from(paymentsTable)
      .where(and(gte(paymentsTable.createdAt, startOfMonth), sql`status = 'completed'`)),
    db.select({ count: sql<number>`count(*)::int` }).from(membershipsTable)
      .where(sql`status = 'active'`),
  ]);

  const stats = {
    totalMembers: memberStats[0]?.total ?? 0,
    activeMembers: memberStats[0]?.active ?? 0,
    totalTrainers: trainerCount[0]?.count ?? 0,
    totalClasses: classCount[0]?.count ?? 0,
    scheduledClassesToday: scheduledToday[0]?.count ?? 0,
    totalRevenue: Number(totalRevenue[0]?.total ?? 0),
    revenueThisMonth: Number(monthRevenue[0]?.total ?? 0),
    bookingsToday: bookingsToday[0]?.count ?? 0,
    totalBranches: branchCount[0]?.count ?? 0,
    activeMemberships: activeMemberships[0]?.count ?? 0,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const recentMembers = await db
    .select({ id: membersTable.id, firstName: membersTable.firstName, lastName: membersTable.lastName, createdAt: membersTable.createdAt })
    .from(membersTable)
    .orderBy(sql`${membersTable.createdAt} desc`)
    .limit(5);

  const recentBookings = await db
    .select({ id: bookingsTable.id, memberId: bookingsTable.memberId, status: bookingsTable.status, createdAt: bookingsTable.createdAt })
    .from(bookingsTable)
    .orderBy(sql`${bookingsTable.createdAt} desc`)
    .limit(5);

  const recentPayments = await db
    .select({ id: paymentsTable.id, amount: paymentsTable.amount, status: paymentsTable.status, createdAt: paymentsTable.createdAt })
    .from(paymentsTable)
    .orderBy(sql`${paymentsTable.createdAt} desc`)
    .limit(5);

  const activities = [
    ...recentMembers.map(m => ({
      id: m.id,
      type: "member_joined",
      description: `New member ${m.firstName} ${m.lastName} joined`,
      entityId: m.id,
      createdAt: m.createdAt.toISOString(),
    })),
    ...recentBookings.map(b => ({
      id: b.id + 10000,
      type: "booking_created",
      description: `Booking #${b.id} ${b.status}`,
      entityId: b.id,
      createdAt: b.createdAt.toISOString(),
    })),
    ...recentPayments.map(p => ({
      id: p.id + 20000,
      type: "payment_received",
      description: `Payment of $${parseFloat(p.amount).toFixed(2)} ${p.status}`,
      entityId: p.id,
      createdAt: p.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  res.json(GetDashboardRecentActivityResponse.parse(activities));
});

router.get("/dashboard/class-utilization", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      classId: gymClassesTable.id,
      className: gymClassesTable.name,
      category: gymClassesTable.category,
      totalSessions: sql<number>`count(distinct ${classSchedulesTable.id})::int`,
      totalBookings: sql<number>`count(${bookingsTable.id})::int`,
      maxCapacity: gymClassesTable.maxCapacity,
    })
    .from(gymClassesTable)
    .leftJoin(classSchedulesTable, sql`${classSchedulesTable.classId} = ${gymClassesTable.id}`)
    .leftJoin(bookingsTable, sql`${bookingsTable.scheduleId} = ${classSchedulesTable.id}`)
    .groupBy(gymClassesTable.id, gymClassesTable.name, gymClassesTable.category, gymClassesTable.maxCapacity)
    .orderBy(sql`count(${bookingsTable.id}) desc`);

  const result = rows.map(r => ({
    classId: r.classId,
    className: r.className,
    category: r.category,
    totalSessions: r.totalSessions,
    totalBookings: r.totalBookings,
    avgUtilizationPercent:
      r.totalSessions > 0 && r.maxCapacity > 0
        ? Math.round((r.totalBookings / (r.totalSessions * r.maxCapacity)) * 100)
        : 0,
  }));

  res.json(GetDashboardClassUtilizationResponse.parse(result));
});

router.get("/dashboard/revenue-summary", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      month: sql<string>`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`,
      revenue: sql<number>`sum(amount::numeric)`,
      paymentCount: sql<number>`count(*)::int`,
    })
    .from(paymentsTable)
    .where(
      and(
        sql`status = 'completed'`,
        gte(paymentsTable.createdAt, sql`now() - interval '6 months'`),
      ),
    )
    .groupBy(sql`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${paymentsTable.createdAt}, 'YYYY-MM')`);

  const result = rows.map(r => ({
    month: r.month,
    revenue: Number(r.revenue ?? 0),
    paymentCount: r.paymentCount,
  }));

  res.json(GetDashboardRevenueSummaryResponse.parse(result));
});

export default router;
