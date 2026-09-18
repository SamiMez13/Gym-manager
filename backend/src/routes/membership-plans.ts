import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, membershipPlansTable } from "@workspace/db";
import {
  CreateMembershipPlanBody,
  UpdateMembershipPlanBody,
  GetMembershipPlanParams,
  UpdateMembershipPlanParams,
  DeleteMembershipPlanParams,
  ListMembershipPlansResponse,
  GetMembershipPlanResponse,
  CreateMembershipPlanResponse,
  UpdateMembershipPlanResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function fmt(p: typeof membershipPlansTable.$inferSelect) {
  return {
    ...p,
    price: parseFloat(p.price),
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/membership-plans", async (req, res): Promise<void> => {
  const plans = await db.select().from(membershipPlansTable).orderBy(membershipPlansTable.createdAt);
  res.json(ListMembershipPlansResponse.parse(plans.map(fmt)));
});

router.post("/membership-plans", async (req, res): Promise<void> => {
  const parsed = CreateMembershipPlanBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [plan] = await db.insert(membershipPlansTable).values({ ...parsed.data, price: String(parsed.data.price) }).returning();
  res.status(201).json(CreateMembershipPlanResponse.parse(fmt(plan)));
});

router.get("/membership-plans/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetMembershipPlanParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [plan] = await db.select().from(membershipPlansTable).where(eq(membershipPlansTable.id, parsed.data.id));
  if (!plan) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetMembershipPlanResponse.parse(fmt(plan)));
});

router.patch("/membership-plans/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdateMembershipPlanParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateMembershipPlanBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }
  const updateData: Record<string, unknown> = { ...bodyParsed.data };
  if (bodyParsed.data.price !== undefined) updateData.price = String(bodyParsed.data.price);
  const [plan] = await db.update(membershipPlansTable).set(updateData).where(eq(membershipPlansTable.id, paramParsed.data.id)).returning();
  if (!plan) { res.status(404).json({ error: "Not found" }); return; }
  res.json(UpdateMembershipPlanResponse.parse(fmt(plan)));
});

router.delete("/membership-plans/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteMembershipPlanParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(membershipPlansTable).where(eq(membershipPlansTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
