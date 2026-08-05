import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { branchesTable } from "./branches";

export const trainersTable = pgTable("trainers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  specialization: text("specialization").notNull(),
  bio: text("bio"),
  branchId: integer("branch_id").notNull().references(() => branchesTable.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrainerSchema = createInsertSchema(trainersTable).omit({ id: true, createdAt: true });
export type InsertTrainer = z.infer<typeof insertTrainerSchema>;
export type Trainer = typeof trainersTable.$inferSelect;
