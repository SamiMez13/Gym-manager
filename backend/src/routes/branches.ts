import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, branchesTable } from "@workspace/db";
import {
  CreateBranchBody,
  UpdateBranchBody,
  GetBranchParams,
  UpdateBranchParams,
  DeleteBranchParams,
  ListBranchesResponse,
  GetBranchResponse,
  CreateBranchResponse,
  UpdateBranchResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/branches", async (req, res): Promise<void> => {
  const branches = await db.select().from(branchesTable).orderBy(branchesTable.createdAt);
  res.json(ListBranchesResponse.parse(branches.map(b => ({ ...b, createdAt: b.createdAt.toISOString() }))));
});

router.post("/branches", async (req, res): Promise<void> => {
  const parsed = CreateBranchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [branch] = await db.insert(branchesTable).values(parsed.data).returning();
  res.status(201).json(CreateBranchResponse.parse({ ...branch, createdAt: branch.createdAt.toISOString() }));
});

router.get("/branches/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetBranchParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, parsed.data.id));
  if (!branch) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetBranchResponse.parse({ ...branch, createdAt: branch.createdAt.toISOString() }));
});

router.patch("/branches/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdateBranchParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdateBranchBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }
  const [branch] = await db.update(branchesTable).set(bodyParsed.data).where(eq(branchesTable.id, paramParsed.data.id)).returning();
  if (!branch) { res.status(404).json({ error: "Not found" }); return; }
  res.json(UpdateBranchResponse.parse({ ...branch, createdAt: branch.createdAt.toISOString() }));
});

router.delete("/branches/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteBranchParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(branchesTable).where(eq(branchesTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
