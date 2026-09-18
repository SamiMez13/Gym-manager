import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, gymClassesTable } from "@workspace/db";
import {
  CreateClassBody,
  UpdateClassBody,
  GetClassParams,
  UpdateClassParams,
  DeleteClassParams,
  ListClassesResponse,
  GetClassResponse,
  CreateClassResponse,
  UpdateClassResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function fmt(c: typeof gymClassesTable.$inferSelect) {
  return { ...c, createdAt: c.createdAt.toISOString() };
}

router.get("/classes", async (req, res): Promise<void> => {
  const classes = await db.select().from(gymClassesTable).orderBy(gymClassesTable.createdAt);
  res.json(ListClassesResponse.parse(classes.map(fmt)));
});

router.post("/classes", async (req, res): Promise<void> => {
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [gymClass] = await db.insert(gymClassesTable).values(parsed.data).returning();
  res.status(201).json(CreateClassResponse.parse(fmt(gymClass)));
});

router.get("/classes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetClassParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [gymClass] = await db.select().from(gymClassesTable).where(eq(gymClassesTable.id, parsed.data.id));
  if (!gymClass) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetClassResponse.parse(fmt(gymClass)));
});

router.patch("/classes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdateClassParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateClassBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }
  const [gymClass] = await db.update(gymClassesTable).set(bodyParsed.data).where(eq(gymClassesTable.id, paramParsed.data.id)).returning();
  if (!gymClass) { res.status(404).json({ error: "Not found" }); return; }
  res.json(UpdateClassResponse.parse(fmt(gymClass)));
});

router.delete("/classes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteClassParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(gymClassesTable).where(eq(gymClassesTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
