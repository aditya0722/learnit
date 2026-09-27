CREATE TYPE "instructor_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('learner', 'instructor', 'admin');--> statement-breakpoint
CREATE TABLE "assignment_questions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "assignment_questions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"assignmentId" integer,
	"questionText" text NOT NULL,
	"options" json NOT NULL,
	"correctOptionIndex" integer NOT NULL,
	"questionType" varchar(50) DEFAULT 'mcq' NOT NULL,
	"correctAnswer" text,
	"codeLanguage" varchar(50),
	"testCases" json,
	"points" integer DEFAULT 1 NOT NULL,
	"explanation" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "assignment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"description" text,
	"chapter" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapter_progress" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chapter_progress_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"chapterId" integer,
	"courseId" integer,
	"isCompleted" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"videoTimeWatched" integer DEFAULT 0 NOT NULL,
	"videoDuration" integer DEFAULT 0 NOT NULL,
	"isVideoWatched" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "chapters_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"chapterName" varchar(255) NOT NULL,
	"courseId" integer,
	"chapterNumber" integer NOT NULL,
	"thumbnail" varchar NOT NULL,
	"videoUrl" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "courses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"topics" text[] NOT NULL,
	"duration" numeric NOT NULL,
	"price" numeric(10,2) NOT NULL,
	"thumbnail" varchar NOT NULL,
	"instructorId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course-taken" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "course-taken_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"price" numeric(10,2) NOT NULL,
	"courseId" integer,
	"userId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "discounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"discount" numeric NOT NULL,
	"couponCode" varchar(50) UNIQUE,
	"courseId" integer,
	"expiresAt" timestamp,
	"maxUses" integer,
	"usedCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_profiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "instructor_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL UNIQUE,
	"status" "instructor_status" DEFAULT 'pending'::"instructor_status" NOT NULL,
	"bio" text,
	"headline" varchar(255),
	"expertise" varchar(255),
	"experienceYears" integer,
	"profileImage" varchar(500),
	"website" varchar(500),
	"linkedin" varchar(500),
	"github" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "password_reset_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token" text NOT NULL UNIQUE,
	"user_id" integer NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "refresh_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token" text NOT NULL UNIQUE,
	"user_id" integer NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_submissions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "assignment_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"assignmentId" integer,
	"userId" integer,
	"score" integer DEFAULT 0 NOT NULL,
	"totalPoints" integer DEFAULT 0 NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_answers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "submission_answers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"submissionId" integer,
	"questionId" integer,
	"answer" text NOT NULL,
	"isCorrect" integer DEFAULT 0 NOT NULL,
	"pointsEarned" integer DEFAULT 0 NOT NULL,
	"output" text,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"password" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'learner'::"user_role" NOT NULL,
	"age" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignment_questions" ADD CONSTRAINT "assignment_questions_assignmentId_assignment_id_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_chapter_chapters_id_fkey" FOREIGN KEY ("chapter") REFERENCES "chapters"("id");--> statement-breakpoint
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_chapterId_chapters_id_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id");--> statement-breakpoint
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_courseId_courses_id_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id");--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_courseId_courses_id_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id");--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructorId_instructor_profiles_id_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id");--> statement-breakpoint
ALTER TABLE "course-taken" ADD CONSTRAINT "course-taken_courseId_courses_id_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id");--> statement-breakpoint
ALTER TABLE "course-taken" ADD CONSTRAINT "course-taken_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_courseId_courses_id_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id");--> statement-breakpoint
ALTER TABLE "instructor_profiles" ADD CONSTRAINT "instructor_profiles_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignmentId_assignment_id_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id");--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_submissionId_assignment_submissions_id_fkey" FOREIGN KEY ("submissionId") REFERENCES "assignment_submissions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_questionId_assignment_questions_id_fkey" FOREIGN KEY ("questionId") REFERENCES "assignment_questions"("id");