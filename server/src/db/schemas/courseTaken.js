

import { integer, numeric, pgTable, timestamp, varchar} from "drizzle-orm/pg-core";
import { coursesTable } from "./courses.js";
import { usersTable } from "./users.js";

export const courseTakenTable = pgTable("course-taken", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    courseId: integer().references(() => coursesTable.id),
    userId: integer().references(() => usersTable.id),

    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});
