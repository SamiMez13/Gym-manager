import { pgTable, text, serial, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { membersTable } from "./members";
import { membershipPlansTable } from "./membership-plans";

export const membershipsTable = pgTable("memberships", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => membersTable.id),
  planId: integer("plan_id").notNull().references(() => membershipPlansTable.id),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMembershipSchema = createInsertSchema(membershipsTable).omit({ id: true, createdAt: true });
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof membershipsTable.$inferSelect;
