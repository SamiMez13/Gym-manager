import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { membersTable } from "./members";
import { classSchedulesTable } from "./class-schedules";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").notNull().references(() => membersTable.id),
  scheduleId: integer("schedule_id").notNull().references(() => classSchedulesTable.id),
  status: text("status").notNull().default("confirmed"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
