import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { coursesTable } from "./courses.js";


export const chaptersTable = pgTable("chapters", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  chapterName: varchar({ length: 255 }).notNull(),
  courseId: integer().references(() => coursesTable.id),
  chapterNumber: integer().notNull(),
  thumbnail:varchar().notNull(),
  videoUrl:varchar().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});

