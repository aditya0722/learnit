import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { AssignmentTable } from "./assignment.js";
import { usersTable } from "./users.js";
import { AssignmentQuestionsTable } from "./assignment.js";

export const AssignmentSubmissionsTable = pgTable("assignment_submissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  assignmentId: integer().references(() => AssignmentTable.id),
  userId: integer().references(() => usersTable.id),
  score: integer().notNull().default(0),
  totalPoints: integer().notNull().default(0),
  submittedAt: timestamp().defaultNow().notNull(),
});

export const SubmissionAnswersTable = pgTable("submission_answers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  submissionId: integer().references(() => AssignmentSubmissionsTable.id, { onDelete: "cascade" }),
  questionId: integer().references(() => AssignmentQuestionsTable.id),
  answer: text().notNull(),
  isCorrect: integer().notNull().default(0),
  pointsEarned: integer().notNull().default(0),
  output: text(),
  error: text(),
});
