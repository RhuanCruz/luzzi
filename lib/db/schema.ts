import { pgTable, serial, text, timestamp, json } from "drizzle-orm/pg-core";

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  analytics: text("analytics"),
  analyticsOther: text("analytics_other"),
  measurements: json("measurements").$type<string[]>(),
  measurementsOther: text("measurements_other"),
  stack: json("stack").$type<string[]>(),
  stackOther: text("stack_other"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;
