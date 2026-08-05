import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { gymClassesTable } from "./gym-classes";
import { trainersTable } from "./trainers";
import { branchesTable } from "./branches";

export const classSchedulesTable = pgTable("class_schedules", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => gymClassesTable.id),
  trainerId: integer("trainer_id").notNull().references(() => trainersTable.id),
  branchId: integer("branch_id").notNull().references(() => branchesTable.id),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertClassScheduleSchema = createInsertSchema(classSchedulesTable).omit({ id: true, createdAt: true });
export type InsertClassSchedule = z.infer<typeof insertClassScheduleSchema>;
export type ClassSchedule = typeof classSchedulesTable.$inferSelect;
