import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users.js";

export const instructorStatusEnum = pgEnum("instructor_status", [
  "pending",
  "approved",
  "rejected",
]);

export const instructorProfilesTable = pgTable("instructor_profiles", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  userId: integer("userId").notNull().unique().references(() => usersTable.id, {
      onDelete: "cascade",
    }),
  status: instructorStatusEnum("status").notNull().default("pending"),
  bio: text(),
  headline: varchar({ length: 255 }),
  expertise: varchar({ length: 255 }),
  experienceYears: integer(),
  profileImage: varchar({ length: 500 }),
  website: varchar({ length: 500 }),
  linkedin: varchar({ length: 500 }),
  github: varchar({ length: 500 }),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});