import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, trainersTable } from "@workspace/db";
import {
  CreateTrainerBody,
  UpdateTrainerBody,
  GetTrainerParams,
  UpdateTrainerParams,
  DeleteTrainerParams,
  ListTrainersResponse,
  GetTrainerResponse,
  CreateTrainerResponse,
  UpdateTrainerResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function fmt(t: typeof trainersTable.$inferSelect) {
  return { ...t, createdAt: t.createdAt.toISOString() };
}

router.get("/trainers", async (req, res): Promise<void> => {
  const trainers = await db.select().from(trainersTable).orderBy(trainersTable.createdAt);
  res.json(ListTrainersResponse.parse(trainers.map(fmt)));
});

router.post("/trainers", async (req, res): Promise<void> => {
  const parsed = CreateTrainerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [trainer] = await db.insert(trainersTable).values(parsed.data).returning();
  res.status(201).json(CreateTrainerResponse.parse(fmt(trainer)));
});

router.get("/trainers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetTrainerParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [trainer] = await db.select().from(trainersTable).where(eq(trainersTable.id, parsed.data.id));
  if (!trainer) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetTrainerResponse.parse(fmt(trainer)));
});

router.patch("/trainers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdateTrainerParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateTrainerBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }
  const [trainer] = await db.update(trainersTable).set(bodyParsed.data).where(eq(trainersTable.id, paramParsed.data.id)).returning();
  if (!trainer) { res.status(404).json({ error: "Not found" }); return; }
  res.json(UpdateTrainerResponse.parse(fmt(trainer)));
});

router.delete("/trainers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteTrainerParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(trainersTable).where(eq(trainersTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
