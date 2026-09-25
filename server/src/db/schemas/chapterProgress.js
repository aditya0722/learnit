import { integer, pgTable, timestamp, boolean } from "drizzle-orm/pg-core";
import { chaptersTable } from "./chapters.js";
import { coursesTable } from "./courses.js";
import { usersTable } from "./users.js";

export const chapterProgressTable = pgTable("chapter_progress", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().references(() => usersTable.id),
  chapterId: integer().references(() => chaptersTable.id),
  courseId: integer().references(() => coursesTable.id),
  isCompleted: boolean().default(false).notNull(),
  completedAt: timestamp(),
  videoTimeWatched: integer().default(0).notNull(),
  videoDuration: integer().default(0).notNull(),
  isVideoWatched: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
