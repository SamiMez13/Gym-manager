import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, membersTable } from "@workspace/db";
import {
  CreateMemberBody,
  UpdateMemberBody,
  GetMemberParams,
  UpdateMemberParams,
  DeleteMemberParams,
  ListMembersResponse,
  GetMemberResponse,
  CreateMemberResponse,
  UpdateMemberResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function fmt(m: typeof membersTable.$inferSelect) {
  return {
    ...m,
    joinedAt: m.joinedAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/members", async (req, res): Promise<void> => {
  const members = await db.select().from(membersTable).orderBy(membersTable.createdAt);
  res.json(ListMembersResponse.parse(members.map(fmt)));
});

router.post("/members", async (req, res): Promise<void> => {
  const parsed = CreateMemberBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [member] = await db.insert(membersTable).values(parsed.data).returning();
  res.status(201).json(CreateMemberResponse.parse(fmt(member)));
});

router.get("/members/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetMemberParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, parsed.data.id));
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetMemberResponse.parse(fmt(member)));
});

router.patch("/members/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdateMemberParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateMemberBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }
  const [member] = await db.update(membersTable).set(bodyParsed.data).where(eq(membersTable.id, paramParsed.data.id)).returning();
  if (!member) { res.status(404).json({ error: "Not found" }); return; }
  res.json(UpdateMemberResponse.parse(fmt(member)));
});

router.delete("/members/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteMemberParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(membersTable).where(eq(membersTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
