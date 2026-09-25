

import { integer, json, pgTable, text, timestamp, varchar} from "drizzle-orm/pg-core";
import { chaptersTable } from "./chapters.js";

export const AssignmentTable = pgTable("assignment", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    chapter: integer().references(() => chaptersTable.id),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});

export const AssignmentQuestionsTable = pgTable("assignment_questions", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    assignmentId: integer().references(() => AssignmentTable.id, { onDelete: "cascade" }),
    questionText: text().notNull(),
    options: json().notNull(),
    correctOptionIndex: integer().notNull(),
    questionType: varchar({ length: 50 }).notNull().default("mcq"),
    correctAnswer: text(),
    codeLanguage: varchar({ length: 50 }),
    testCases: json(),
    points: integer().notNull().default(1),
    explanation: text(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});