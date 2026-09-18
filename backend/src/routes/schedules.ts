import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, classSchedulesTable, gymClassesTable, trainersTable, branchesTable, bookingsTable } from "@workspace/db";
import {
  CreateScheduleBody,
  UpdateScheduleBody,
  GetScheduleParams,
  UpdateScheduleParams,
  DeleteScheduleParams,
  ListSchedulesResponse,
  GetScheduleResponse,
  CreateScheduleResponse,
  UpdateScheduleResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getScheduleWithDetails(id: number) {
  const [row] = await db
    .select({
      id: classSchedulesTable.id,
      classId: classSchedulesTable.classId,
      className: gymClassesTable.name,
      trainerId: classSchedulesTable.trainerId,
      trainerFirstName: trainersTable.firstName,
      trainerLastName: trainersTable.lastName,
      branchId: classSchedulesTable.branchId,
      branchName: branchesTable.name,
      startTime: classSchedulesTable.startTime,
      endTime: classSchedulesTable.endTime,
      status: classSchedulesTable.status,
      notes: classSchedulesTable.notes,
      maxCapacity: gymClassesTable.maxCapacity,
      createdAt: classSchedulesTable.createdAt,
    })
    .from(classSchedulesTable)
    .leftJoin(gymClassesTable, eq(classSchedulesTable.classId, gymClassesTable.id))
    .leftJoin(trainersTable, eq(classSchedulesTable.trainerId, trainersTable.id))
    .leftJoin(branchesTable, eq(classSchedulesTable.branchId, branchesTable.id))
    .where(eq(classSchedulesTable.id, id));

  if (!row) return null;

  const bookingCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable)
    .where(eq(bookingsTable.scheduleId, id));

  return {
    ...row,
    trainerName: row.trainerFirstName && row.trainerLastName ? `${row.trainerFirstName} ${row.trainerLastName}` : null,
    currentBookings: bookingCount[0]?.count ?? 0,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/schedules", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: classSchedulesTable.id,
      classId: classSchedulesTable.classId,
      className: gymClassesTable.name,
      trainerId: classSchedulesTable.trainerId,
      trainerFirstName: trainersTable.firstName,
      trainerLastName: trainersTable.lastName,
      branchId: classSchedulesTable.branchId,
      branchName: branchesTable.name,
      startTime: classSchedulesTable.startTime,
      endTime: classSchedulesTable.endTime,
      status: classSchedulesTable.status,
      notes: classSchedulesTable.notes,
      maxCapacity: gymClassesTable.maxCapacity,
      createdAt: classSchedulesTable.createdAt,
    })
    .from(classSchedulesTable)
    .leftJoin(gymClassesTable, eq(classSchedulesTable.classId, gymClassesTable.id))
    .leftJoin(trainersTable, eq(classSchedulesTable.trainerId, trainersTable.id))
    .leftJoin(branchesTable, eq(classSchedulesTable.branchId, branchesTable.id))
    .orderBy(classSchedulesTable.startTime);

  const bookingCounts = await db
    .select({
      scheduleId: bookingsTable.scheduleId,
      count: sql<number>`count(*)::int`,
    })
    .from(bookingsTable)
    .groupBy(bookingsTable.scheduleId);

  const countMap = new Map(bookingCounts.map(b => [b.scheduleId, b.count]));

  const result = rows.map(r => ({
    ...r,
    trainerName: r.trainerFirstName && r.trainerLastName ? `${r.trainerFirstName} ${r.trainerLastName}` : null,
    currentBookings: countMap.get(r.id) ?? 0,
    startTime: r.startTime.toISOString(),
    endTime: r.endTime.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(ListSchedulesResponse.parse(result));
});

router.post("/schedules", async (req, res): Promise<void> => {
  const parsed = CreateScheduleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const data = {
    ...parsed.data,
    startTime: new Date(parsed.data.startTime),
    endTime: new Date(parsed.data.endTime),
  };
  const [schedule] = await db.insert(classSchedulesTable).values(data).returning();
  const full = await getScheduleWithDetails(schedule.id);
  res.status(201).json(CreateScheduleResponse.parse(full));
});

router.get("/schedules/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetScheduleParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const schedule = await getScheduleWithDetails(parsed.data.id);
  if (!schedule) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetScheduleResponse.parse(schedule));
});

router.patch("/schedules/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdateScheduleParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateScheduleBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }

  const updateData: Record<string, unknown> = { ...bodyParsed.data };
  if (bodyParsed.data.startTime) updateData.startTime = new Date(bodyParsed.data.startTime);
  if (bodyParsed.data.endTime) updateData.endTime = new Date(bodyParsed.data.endTime);

  const [schedule] = await db.update(classSchedulesTable).set(updateData).where(eq(classSchedulesTable.id, paramParsed.data.id)).returning();
  if (!schedule) { res.status(404).json({ error: "Not found" }); return; }
  const full = await getScheduleWithDetails(schedule.id);
  res.json(UpdateScheduleResponse.parse(full));
});

router.delete("/schedules/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteScheduleParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(classSchedulesTable).where(eq(classSchedulesTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
