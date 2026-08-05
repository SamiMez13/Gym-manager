import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, membershipsTable, membersTable, membershipPlansTable } from "@workspace/db";
import {
  CreateMembershipBody,
  UpdateMembershipBody,
  GetMembershipParams,
  UpdateMembershipParams,
  DeleteMembershipParams,
  ListMembershipsResponse,
  GetMembershipResponse,
  CreateMembershipResponse,
  UpdateMembershipResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getMembershipWithDetails(id: number) {
  const [row] = await db
    .select({
      id: membershipsTable.id,
      memberId: membershipsTable.memberId,
      memberFirstName: membersTable.firstName,
      memberLastName: membersTable.lastName,
      planId: membershipsTable.planId,
      planName: membershipPlansTable.name,
      startDate: membershipsTable.startDate,
      endDate: membershipsTable.endDate,
      status: membershipsTable.status,
      createdAt: membershipsTable.createdAt,
    })
    .from(membershipsTable)
    .leftJoin(membersTable, eq(membershipsTable.memberId, membersTable.id))
    .leftJoin(membershipPlansTable, eq(membershipsTable.planId, membershipPlansTable.id))
    .where(eq(membershipsTable.id, id));

  if (!row) return null;
  return {
    ...row,
    memberName: row.memberFirstName && row.memberLastName ? `${row.memberFirstName} ${row.memberLastName}` : null,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/memberships", async (req, res): Promise<void> => {
  const rows = await db
    .select({
      id: membershipsTable.id,
      memberId: membershipsTable.memberId,
      memberFirstName: membersTable.firstName,
      memberLastName: membersTable.lastName,
      planId: membershipsTable.planId,
      planName: membershipPlansTable.name,
      startDate: membershipsTable.startDate,
      endDate: membershipsTable.endDate,
      status: membershipsTable.status,
      createdAt: membershipsTable.createdAt,
    })
    .from(membershipsTable)
    .leftJoin(membersTable, eq(membershipsTable.memberId, membersTable.id))
    .leftJoin(membershipPlansTable, eq(membershipsTable.planId, membershipPlansTable.id))
    .orderBy(membershipsTable.createdAt);

  const result = rows.map(r => ({
    ...r,
    memberName: r.memberFirstName && r.memberLastName ? `${r.memberFirstName} ${r.memberLastName}` : null,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(ListMembershipsResponse.parse(result));
});

router.post("/memberships", async (req, res): Promise<void> => {
  const parsed = CreateMembershipBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Auto-compute endDate from plan
  let endDate = parsed.data.endDate;
  if (!endDate) {
    const [plan] = await db.select().from(membershipPlansTable).where(eq(membershipPlansTable.id, parsed.data.planId));
    if (plan) {
      const start = new Date(parsed.data.startDate);
      start.setDate(start.getDate() + plan.durationDays);
      endDate = start.toISOString().split("T")[0];
    } else {
      endDate = parsed.data.startDate;
    }
  }

  const [membership] = await db.insert(membershipsTable).values({ ...parsed.data, endDate }).returning();
  const full = await getMembershipWithDetails(membership.id);
  res.status(201).json(CreateMembershipResponse.parse(full));
});

router.get("/memberships/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetMembershipParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const full = await getMembershipWithDetails(parsed.data.id);
  if (!full) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetMembershipResponse.parse(full));
});

router.patch("/memberships/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdateMembershipParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateMembershipBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }
  const [membership] = await db.update(membershipsTable).set(bodyParsed.data).where(eq(membershipsTable.id, paramParsed.data.id)).returning();
  if (!membership) { res.status(404).json({ error: "Not found" }); return; }
  const full = await getMembershipWithDetails(membership.id);
  res.json(UpdateMembershipResponse.parse(full));
});

router.delete("/memberships/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteMembershipParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(membershipsTable).where(eq(membershipsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
