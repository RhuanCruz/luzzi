import {
  pgTable,
  serial,
  text,
  timestamp,
  json,
  uuid,
  integer,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// ==========================================
// Existing Waitlist Table
// ==========================================

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

// ==========================================
// Better Auth Tables
// ==========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==========================================
// Luzzi Analytics Tables
// ==========================================

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    userId: text("user_id").notNull(), // User ID from better-auth session
    apiKeyLive: text("api_key_live").notNull().unique(),
    apiKeyTest: text("api_key_test").notNull().unique(),
    plan: text("plan").notNull().default("free"),
    eventsLimit: integer("events_limit").notNull().default(10000),
    eventsCount: integer("events_count").notNull().default(0),
    eventsResetAt: timestamp("events_reset_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_projects_user").on(table.userId),
    index("idx_projects_api_key_live").on(table.apiKeyLive),
    index("idx_projects_api_key_test").on(table.apiKeyTest),
  ]
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    eventName: text("event_name").notNull(),
    properties: jsonb("properties").default({}),
    sessionId: text("session_id"),
    userId: text("user_id"), // User ID from the client app (not our auth user)
    device: jsonb("device").default({}),
    geo: jsonb("geo").default({}), // { country, city, region } from IP
    timestamp: timestamp("timestamp").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("idx_events_project_time").on(table.projectId, table.timestamp),
    index("idx_events_name").on(table.projectId, table.eventName),
    index("idx_events_session").on(table.projectId, table.sessionId),
  ]
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// ==========================================
// Helper function to generate API keys
// ==========================================

export function generateApiKey(prefix: "pk_live" | "pk_test"): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}_${hex}`;
}
