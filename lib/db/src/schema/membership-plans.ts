import { pgTable, text, serial, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const membershipPlansTable = pgTable("membership_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  durationDays: integer("duration_days").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  maxClassesPerMonth: integer("max_classes_per_month"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMembershipPlanSchema = createInsertSchema(membershipPlansTable).omit({ id: true, createdAt: true });
export type InsertMembershipPlan = z.infer<typeof insertMembershipPlanSchema>;
export type MembershipPlan = typeof membershipPlansTable.$inferSelect;
