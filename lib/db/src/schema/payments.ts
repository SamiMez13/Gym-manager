import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { membersTable } from "./members";
import { membershipsTable } from "./memberships";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => membersTable.id),
  membershipId: integer("membership_id").references(() => membershipsTable.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull().default("membership"),
  status: text("status").notNull().default("completed"),
  method: text("method"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
