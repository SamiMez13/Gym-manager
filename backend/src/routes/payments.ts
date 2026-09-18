import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, paymentsTable, membersTable } from "@workspace/db";
import {
  CreatePaymentBody,
  UpdatePaymentBody,
  GetPaymentParams,
  UpdatePaymentParams,
  ListPaymentsResponse,
  GetPaymentResponse,
  CreatePaymentResponse,
  UpdatePaymentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function fmtPayment(r: {
  id: number;
  memberId: number;
  memberFirstName: string | null;
  memberLastName: string | null;
  membershipId: number | null;
  amount: string;
  type: string;
  status: string;
  method: string | null;
  notes: string | null;
  createdAt: Date;
}) {
  return {
    ...r,
    memberName: r.memberFirstName && r.memberLastName ? `${r.memberFirstName} ${r.memberLastName}` : null,
    amount: parseFloat(r.amount),
    createdAt: r.createdAt.toISOString(),
  };
}

const paymentsWithMember = () =>
  db
    .select({
      id: paymentsTable.id,
      memberId: paymentsTable.memberId,
      memberFirstName: membersTable.firstName,
      memberLastName: membersTable.lastName,
      membershipId: paymentsTable.membershipId,
      amount: paymentsTable.amount,
      type: paymentsTable.type,
      status: paymentsTable.status,
      method: paymentsTable.method,
      notes: paymentsTable.notes,
      createdAt: paymentsTable.createdAt,
    })
    .from(paymentsTable)
    .leftJoin(membersTable, eq(paymentsTable.memberId, membersTable.id));

router.get("/payments", async (req, res): Promise<void> => {
  const rows = await paymentsWithMember().orderBy(paymentsTable.createdAt);
  res.json(ListPaymentsResponse.parse(rows.map(fmtPayment)));
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [payment] = await db.insert(paymentsTable).values({ ...parsed.data, amount: String(parsed.data.amount) }).returning();
  const [full] = await paymentsWithMember().where(eq(paymentsTable.id, payment.id));
  res.status(201).json(CreatePaymentResponse.parse(fmtPayment(full)));
});

router.get("/payments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetPaymentParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [full] = await paymentsWithMember().where(eq(paymentsTable.id, parsed.data.id));
  if (!full) { res.status(404).json({ error: "Not found" }); return; }
  res.json(GetPaymentResponse.parse(fmtPayment(full)));
});

router.patch("/payments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdatePaymentParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = UpdatePaymentBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: bodyParsed.error.message }); return; }
  const [payment] = await db.update(paymentsTable).set(bodyParsed.data).where(eq(paymentsTable.id, paramParsed.data.id)).returning();
  if (!payment) { res.status(404).json({ error: "Not found" }); return; }
  const [full] = await paymentsWithMember().where(eq(paymentsTable.id, payment.id));
  res.json(UpdatePaymentResponse.parse(fmtPayment(full)));
});

export default router;
