ALTER TABLE "assignment_questions" ADD COLUMN "questionType" varchar(50) DEFAULT 'mcq' NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_questions" ADD COLUMN "correctAnswer" text;--> statement-breakpoint
ALTER TABLE "assignment_questions" ADD COLUMN "codeLanguage" varchar(50);--> statement-breakpoint
ALTER TABLE "assignment_questions" ADD COLUMN "testCases" json;--> statement-breakpoint
ALTER TABLE "assignment_questions" ADD COLUMN "points" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_questions" ADD COLUMN "explanation" text;--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "assignment_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"assignmentId" integer,
	"userId" integer,
	"score" integer DEFAULT 0 NOT NULL,
	"totalPoints" integer DEFAULT 0 NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "submission_answers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "submission_answers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"submissionId" integer,
	"questionId" integer,
	"answer" text NOT NULL,
	"isCorrect" integer DEFAULT 0 NOT NULL,
	"pointsEarned" integer DEFAULT 0 NOT NULL,
	"output" text,
	"error" text
);--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignmentId_assignment_id_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id");--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_submissionId_assignment_submissions_id_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_questionId_assignment_questions_id_fkey" FOREIGN KEY ("questionId") REFERENCES "assignment_questions"("id");
