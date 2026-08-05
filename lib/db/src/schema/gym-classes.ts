import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gymClassesTable = pgTable("gym_classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  maxCapacity: integer("max_capacity").notNull(),
  difficultyLevel: text("difficulty_level").notNull().default("beginner"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGymClassSchema = createInsertSchema(gymClassesTable).omit({ id: true, createdAt: true });
export type InsertGymClass = z.infer<typeof insertGymClassSchema>;
export type GymClass = typeof gymClassesTable.$inferSelect;
