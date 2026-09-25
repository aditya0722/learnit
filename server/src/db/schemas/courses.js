
import { integer, numeric, pgTable, timestamp, varchar, text } from "drizzle-orm/pg-core";
import { instructorProfilesTable } from "./instructorProfiles.js";

export const coursesTable = pgTable("courses", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    topics: text("topics").array().notNull(),
    duration: numeric().notNull(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    thumbnail: varchar().notNull(),
    instructorId: integer().references(() => instructorProfilesTable.id),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});
