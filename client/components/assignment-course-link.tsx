"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, CheckCircle2 } from "lucide-react";
import { submissionApi, type Assignment } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function AssignmentCourseLink({
  assignment,
  courseId,
}: {
  assignment: Assignment;
  courseId: number;
}) {
  const { user } = useAuth();
  const {
    data: submissions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["assignmentSubmissions", assignment.id, user?.id],
    queryFn: () => submissionApi.getByAssignment(assignment.id),
    enabled: !!user,
  });
  const latest = [...submissions].sort(
    (a, b) =>
      Date.parse(b.submittedAt) - Date.parse(a.submittedAt) || b.id - a.id,
  )[0];

  return (
    <Link
      href={`/dashboard/courses/${courseId}/assignments/${assignment.id}`}
      className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-surface"
      aria-label={`${assignment.title}: ${latest ? "View submissions" : "Open assignment"}`}
    >
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${latest ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"}`}
      >
        {latest ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <FileText className="size-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {assignment.title}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {assignment.questions.length}{" "}
          {assignment.questions.length === 1 ? "question" : "questions"}
        </p>
        {latest ? (
          <p className="mt-1 text-xs font-medium text-primary">
            View submissions · {latest.score} / {latest.totalPoints} marks
            <span className="block text-[11px] font-normal text-muted-foreground">
              {submissions.length}{" "}
              {submissions.length === 1 ? "attempt" : "attempts"} · latest
              result
            </span>
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            {isLoading
              ? "Checking submissions…"
              : isError
                ? "Open assignment to check submissions"
                : "Start assignment"}
          </p>
        )}
      </div>
    </Link>
  );
}
