import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable, membersTable, classSchedulesTable, gymClassesTable } from "@workspace/db";
import {
  CreateBookingBody,
  UpdateBookingBody,
  GetBookingParams,
  UpdateBookingParams,
  DeleteBookingParams,
  ListBookingsResponse,
  GetBookingResponse,
  CreateBookingResponse,
  UpdateBookingResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bookings", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: bookingsTable.id,
      memberId: bookingsTable.memberId,
      memberFirstName: membersTable.firstName,
      memberLastName: membersTable.lastName,
      scheduleId: bookingsTable.scheduleId,
      className: gymClassesTable.name,
      status: bookingsTable.status,
      notes: bookingsTable.notes,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(membersTable, eq(bookingsTable.memberId, membersTable.id))
    .leftJoin(classSchedulesTable, eq(bookingsTable.scheduleId, classSchedulesTable.id))
    .leftJoin(gymClassesTable, eq(classSchedulesTable.classId, gymClassesTable.id))
    .orderBy(bookingsTable.createdAt);

  const result = rows.map(r => ({
    ...r,
    memberName: r.memberFirstName && r.memberLastName ? `${r.memberFirstName} ${r.memberLastName}` : null,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(ListBookingsResponse.parse(result));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [booking] = await db.insert(bookingsTable).values(parsed.data).returning();

  const [full] = await db
    .select({
      id: bookingsTable.id,
      memberId: bookingsTable.memberId,
      memberFirstName: membersTable.firstName,
      memberLastName: membersTable.lastName,
      scheduleId: bookingsTable.scheduleId,
      className: gymClassesTable.name,
      status: bookingsTable.status,
      notes: bookingsTable.notes,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(membersTable, eq(bookingsTable.memberId, membersTable.id))
    .leftJoin(classSchedulesTable, eq(bookingsTable.scheduleId, classSchedulesTable.id))
    .leftJoin(gymClassesTable, eq(classSchedulesTable.classId, gymClassesTable.id))
    .where(eq(bookingsTable.id, booking.id));

  res.status(201).json(CreateBookingResponse.parse({
    ...full,
    memberName: full.memberFirstName && full.memberLastName ? `${full.memberFirstName} ${full.memberLastName}` : null,
    createdAt: full.createdAt.toISOString(),
  }));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [full] = await db
    .select({
      id: bookingsTable.id,
      memberId: bookingsTable.memberId,
      memberFirstName: membersTable.firstName,
      memberLastName: membersTable.lastName,
      scheduleId: bookingsTable.scheduleId,
      className: gymClassesTable.name,
      status: bookingsTable.status,
      notes: bookingsTable.notes,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(membersTable, eq(bookingsTable.memberId, membersTable.id))
    .leftJoin(classSchedulesTable, eq(bookingsTable.scheduleId, classSchedulesTable.id))
    .leftJoin(gymClassesTable, eq(classSchedulesTable.classId, gymClassesTable.id))
    .where(eq(bookingsTable.id, parsed.data.id));

  if (!full) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetBookingResponse.parse({
    ...full,
    memberName: full.memberFirstName && full.memberLastName ? `${full.memberFirstName} ${full.memberLastName}` : null,
    createdAt: full.createdAt.toISOString(),
  }));
});

router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdateBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateBookingBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }

  const [booking] = await db.update(bookingsTable).set(bodyParsed.data).where(eq(bookingsTable.id, paramParsed.data.id)).returning();
  if (!booking) { res.status(404).json({ error: "Not found" }); return; }

  const [full] = await db
    .select({
      id: bookingsTable.id,
      memberId: bookingsTable.memberId,
      memberFirstName: membersTable.firstName,
      memberLastName: membersTable.lastName,
      scheduleId: bookingsTable.scheduleId,
      className: gymClassesTable.name,
      status: bookingsTable.status,
      notes: bookingsTable.notes,
      createdAt: bookingsTable.createdAt,
    })
    .from(bookingsTable)
    .leftJoin(membersTable, eq(bookingsTable.memberId, membersTable.id))
    .leftJoin(classSchedulesTable, eq(bookingsTable.scheduleId, classSchedulesTable.id))
    .leftJoin(gymClassesTable, eq(classSchedulesTable.classId, gymClassesTable.id))
    .where(eq(bookingsTable.id, booking.id));

  res.json(UpdateBookingResponse.parse({
    ...full,
    memberName: full.memberFirstName && full.memberLastName ? `${full.memberFirstName} ${full.memberLastName}` : null,
    createdAt: full.createdAt.toISOString(),
  }));
});

router.delete("/bookings/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteBookingParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(bookingsTable).where(eq(bookingsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
