

import { integer, numeric, pgTable, timestamp, varchar} from "drizzle-orm/pg-core";
import { coursesTable } from "./courses.js";

export const discountTable = pgTable("discounts", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    discount: numeric().notNull(),
    couponCode: varchar({ length: 50 }).unique(),
    courseId: integer().references(() => coursesTable.id),
    expiresAt: timestamp(),
    maxUses: integer(),
    usedCount: integer().default(0).notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});
