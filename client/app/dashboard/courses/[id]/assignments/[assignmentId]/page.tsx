"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Trophy,
  Clock,
  RotateCcw,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assignmentApi, submissionApi, type Submission } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useSnackbar } from "@/components/snackbar-provider";
import { CodeEditor } from "@/components/code-editor";

export default function AssignmentTakePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const assignmentId = Number(params.assignmentId);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useSnackbar();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    number | null
  >(null);
  const [isRetaking, setIsRetaking] = useState(false);

  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => assignmentApi.getById(assignmentId),
    enabled: !!assignmentId,
  });

  const historyKey = ["assignmentSubmissions", assignmentId, user?.id];
  const {
    data: submissions = [],
    isLoading: loadingSubmissions,
    isError: historyError,
    refetch: retryHistory,
  } = useQuery({
    queryKey: historyKey,
    queryFn: () => submissionApi.getByAssignment(assignmentId),
    enabled: !!assignmentId && !!user,
  });
  const attempts = [...submissions].sort(
    (a, b) =>
      Date.parse(b.submittedAt) - Date.parse(a.submittedAt) || b.id - a.id,
  );
  const reviewId = selectedSubmissionId ?? attempts[0]?.id;
  const {
    data: result,
    isLoading: loadingResult,
    isError: resultError,
    refetch: retryResult,
  } = useQuery({
    queryKey: ["submission", reviewId, user?.id],
    queryFn: () => submissionApi.getDetail(reviewId!),
    enabled: !!reviewId && !!user && !isRetaking,
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const answerArray = Object.entries(answers)
        .filter(([, answer]) => answer.trim().length > 0)
        .map(([questionId, answer]) => ({
          questionId: Number(questionId),
          answer,
        }));
      return submissionApi.submit(assignmentId, answerArray);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Submission[]>(historyKey, (previous = []) => [
        data.submission,
        ...previous.filter((attempt) => attempt.id !== data.submission.id),
      ]);
      setSelectedSubmissionId(data.submission.id);
      setIsRetaking(false);
      setAnswers({});
      setCurrentQuestion(0);
      void queryClient.invalidateQueries({ queryKey: historyKey });
      void queryClient.invalidateQueries({
        queryKey: ["chapterProgress", courseId],
      });
      toast("Assignment submitted!", "success");
    },
    onError: () => {
      toast("Failed to submit assignment.", "error");
    },
  });

  const setAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const questions = assignment?.questions || [];
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const answeredCount = Object.values(answers).filter(
    (answer) => answer.trim().length > 0,
  ).length;

  const startRedo = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setIsRetaking(true);
    submitMutation.reset();
  };

  const historyPanel = attempts.length > 0 && (
    <Card>
      <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4" />
          Your submissions
        </CardTitle>
        {!isRetaking && (
          <Button variant="outline" onClick={startRedo}>
            <RotateCcw className="size-4" />
            Redo assignment
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {attempts.map((attempt, index) => (
          <Button
            key={attempt.id}
            variant={
              !isRetaking && reviewId === attempt.id ? "secondary" : "ghost"
            }
            className="h-auto min-h-14 w-full justify-between gap-3 whitespace-normal px-3 py-3 text-left"
            onClick={() => {
              setSelectedSubmissionId(attempt.id);
              setIsRetaking(false);
            }}
            aria-pressed={!isRetaking && reviewId === attempt.id}
          >
            <span>
              <span className="block font-medium">
                Attempt {attempts.length - index}
                {index === 0 ? " · Latest" : ""}
              </span>
              <span className="block text-xs font-normal text-muted-foreground">
                {new Date(attempt.submittedAt).toLocaleString()}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block">
                {attempt.score} / {attempt.totalPoints} marks
              </span>
              <span className="block text-xs font-normal text-primary">
                View submission
              </span>
            </span>
          </Button>
        ))}
        {isRetaking && (
          <p className="pt-2 text-xs text-muted-foreground">
            This is a new attempt. Your earlier submissions and marks are kept.
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (loadingAssignment || loadingSubmissions) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted-foreground">Assignment not found.</p>
        <Button variant="ghost" size="sm" asChild className="mt-4">
          <Link href={`/dashboard/courses/${courseId}`}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to course
          </Link>
        </Button>
      </div>
    );
  }

  if (historyError || (!isRetaking && reviewId && resultError)) {
    return (
      <div className="space-y-5">
        {historyPanel}
        <Card>
          <CardContent className="space-y-4 p-6" role="alert">
            <p>
              We couldn’t load your{" "}
              {historyError ? "submission history" : "submission"}. Your saved
              attempts have not been changed.
            </p>
            <Button
              variant="outline"
              onClick={() => (historyError ? retryHistory() : retryResult())}
            >
              Try again
            </Button>
            <Button variant="ghost" asChild>
              <Link href={`/dashboard/courses/${courseId}`}>
                Back to course
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isRetaking && reviewId && loadingResult) {
    return (
      <div className="space-y-5">
        {historyPanel}
        <div
          role="status"
          aria-label="Loading submission"
          className="flex justify-center py-16"
        >
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (result && !isRetaking) {
    const passed =
      result.submission.totalPoints > 0 &&
      result.submission.score / result.submission.totalPoints >= 0.7;
    const percentage =
      result.submission.totalPoints > 0
        ? Math.round(
            (result.submission.score / result.submission.totalPoints) * 100,
          )
        : 0;

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
            <Link
              href={`/dashboard/courses/${courseId}`}
              aria-label="Back to course"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-navy tracking-tight">
              Results: {assignment.title}
            </h1>
          </div>
        </motion.div>

        {historyPanel}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-3xl font-bold text-navy">
                    {result.submission.score} / {result.submission.totalPoints}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {percentage}% of marks
                  </p>
                  <div className="w-full h-2 bg-border rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                    passed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {passed ? "Passed" : "Failed"}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-4">
          {result.answers.map((ans, idx) => {
            const isCorrect = ans.isCorrect === 1;
            return (
              <motion.div
                key={ans.id ?? ans.questionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + idx * 0.04 }}
              >
                <Card
                  className={`border ${isCorrect ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"}`}
                >
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isCorrect ? "bg-emerald-100" : "bg-red-100"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-navy">
                          Q{idx + 1}.{" "}
                          {ans.question?.questionText ??
                            "Question no longer available"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ans.pointsEarned} / {ans.question?.points || 1}{" "}
                          points
                        </p>
                      </div>
                    </div>

                    {!ans.answer && (
                      <p className="ml-9 text-xs text-muted-foreground">
                        Not answered
                      </p>
                    )}

                    {ans.answer && !ans.question && (
                      <pre className="whitespace-pre-wrap break-words text-xs">
                        {ans.answer}
                      </pre>
                    )}

                    {ans.question?.questionType === "mcq" && (
                      <div className="ml-9 space-y-1">
                        {ans.question.options.map((opt, oi) => {
                          const isSelected = ans.answer === String(oi);
                          const isCorrectOption =
                            ans.question?.correctOptionIndex === oi;
                          return (
                            <div
                              key={oi}
                              className={`px-3 py-1.5 rounded text-xs ${
                                isCorrectOption
                                  ? "bg-emerald-100 text-emerald-700 font-medium"
                                  : isSelected
                                    ? "bg-red-100 text-red-700"
                                    : "bg-surface text-muted-foreground"
                              }`}
                            >
                              {opt}
                              {isSelected && " (your answer)"}
                              {isCorrectOption && " ✓"}
                              {isSelected && !isCorrectOption && " ✗"}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {ans.answer &&
                      ans.question?.questionType === "true_false" && (
                        <div className="ml-9 space-y-1">
                          <p className="text-xs">
                            Your answer:{" "}
                            <span
                              className={
                                isCorrect ? "text-emerald-700" : "text-red-600"
                              }
                            >
                              {ans.answer === "true" ? "True" : "False"}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-xs text-emerald-700">
                              Correct answer:{" "}
                              {ans.question.correctAnswer === "true"
                                ? "True"
                                : "False"}
                            </p>
                          )}
                        </div>
                      )}

                    {ans.answer &&
                      ans.question?.questionType === "text_answer" && (
                        <div className="ml-9 space-y-1">
                          <p className="text-xs">
                            Your answer:{" "}
                            <span
                              className={
                                isCorrect ? "text-emerald-700" : "text-red-600"
                              }
                            >
                              {ans.answer}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-xs text-emerald-700">
                              Expected: {ans.question.correctAnswer}
                            </p>
                          )}
                        </div>
                      )}

                    {ans.answer && ans.question?.questionType === "code" && (
                      <div className="ml-9 space-y-2">
                        <p className="text-xs font-medium">
                          Your submitted code
                        </p>
                        <pre className="max-h-80 overflow-auto rounded-lg bg-surface p-3 text-xs whitespace-pre-wrap break-words">
                          {ans.answer}
                        </pre>
                        <p className="text-xs">
                          Your answer:{" "}
                          <span
                            className={
                              isCorrect ? "text-emerald-700" : "text-red-600"
                            }
                          >
                            {isCorrect
                              ? "All test cases passed"
                              : "Some test cases failed"}
                          </span>
                        </p>
                        {ans.output && (
                          <pre className="text-[10px] font-mono bg-navy/5 p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap">
                            {ans.output}
                          </pre>
                        )}
                        {ans.error && (
                          <pre className="text-[10px] font-mono bg-red-50 text-red-600 p-2 rounded max-h-32 overflow-auto whitespace-pre-wrap">
                            {ans.error}
                          </pre>
                        )}
                      </div>
                    )}

                    {ans.question?.explanation && (
                      <div className="ml-9 p-2 rounded bg-blue-50 border border-blue-200">
                        <p className="text-[11px] text-blue-700">
                          {ans.question.explanation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button onClick={startRedo}>
            <RotateCcw className="size-4" />
            Redo assignment
          </Button>
          <Button asChild variant="outline">
            <Link href={`/dashboard/courses/${courseId}`}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to course
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {historyPanel}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link
            href={`/dashboard/courses/${courseId}`}
            aria-label="Back to course"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy tracking-tight">
            {assignment.title}
          </h1>
          {assignment.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {assignment.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {answeredCount}/{questions.length} answered
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5 items-start">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {questions[currentQuestion] && (
                <>
                  {questions[currentQuestion].questionType === "code" ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">
                          Q{currentQuestion + 1}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded">
                          Code Challenge
                        </span>
                        <span className="text-[10px] font-medium text-primary ml-auto">
                          {questions[currentQuestion].points || 1} pt
                          {(questions[currentQuestion].points || 1) !== 1
                            ? "s"
                            : ""}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-navy">
                        {questions[currentQuestion].questionText}
                      </p>
                      <CodeEditor
                        code={answers[questions[currentQuestion].id!] || ""}
                        onChange={(value) =>
                          setAnswer(questions[currentQuestion].id!, value)
                        }
                        language={
                          questions[currentQuestion].codeLanguage ||
                          "javascript"
                        }
                        testCases={questions[currentQuestion].testCases || []}
                      />
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">
                            Q{currentQuestion + 1}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded">
                            {questions[currentQuestion].questionType ===
                              "mcq" && "Multiple Choice"}
                            {questions[currentQuestion].questionType ===
                              "true_false" && "True / False"}
                            {questions[currentQuestion].questionType ===
                              "text_answer" && "Text Answer"}
                          </span>
                          <span className="text-[10px] font-medium text-primary ml-auto">
                            {questions[currentQuestion].points || 1} pt
                            {(questions[currentQuestion].points || 1) !== 1
                              ? "s"
                              : ""}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-navy">
                          {questions[currentQuestion].questionText}
                        </p>

                        {questions[currentQuestion].questionType === "mcq" && (
                          <div className="space-y-2">
                            {questions[currentQuestion].options.map(
                              (opt, oi) => (
                                <button
                                  key={oi}
                                  onClick={() =>
                                    setAnswer(
                                      questions[currentQuestion].id!,
                                      String(oi),
                                    )
                                  }
                                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                                    answers[questions[currentQuestion].id!] ===
                                    String(oi)
                                      ? "border-primary bg-primary/8 text-primary font-medium"
                                      : "border-border hover:bg-surface"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                        answers[
                                          questions[currentQuestion].id!
                                        ] === String(oi)
                                          ? "border-primary bg-primary"
                                          : "border-border"
                                      }`}
                                    >
                                      {answers[
                                        questions[currentQuestion].id!
                                      ] === String(oi) && (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                      )}
                                    </div>
                                    {opt}
                                  </div>
                                </button>
                              ),
                            )}
                          </div>
                        )}

                        {questions[currentQuestion].questionType ===
                          "true_false" && (
                          <div className="grid grid-cols-2 gap-3">
                            {["true", "false"].map((val) => (
                              <button
                                key={val}
                                onClick={() =>
                                  setAnswer(questions[currentQuestion].id!, val)
                                }
                                className={`px-4 py-6 rounded-lg border text-sm font-medium transition-all ${
                                  answers[questions[currentQuestion].id!] ===
                                  val
                                    ? "border-primary bg-primary/8 text-primary"
                                    : "border-border hover:bg-surface"
                                }`}
                              >
                                {val === "true" ? "True" : "False"}
                              </button>
                            ))}
                          </div>
                        )}

                        {questions[currentQuestion].questionType ===
                          "text_answer" && (
                          <textarea
                            value={
                              answers[questions[currentQuestion].id!] || ""
                            }
                            onChange={(e) =>
                              setAnswer(
                                questions[currentQuestion].id!,
                                e.target.value,
                              )
                            }
                            placeholder="Type your answer here..."
                            className="w-full h-32 text-sm rounded-lg border border-border p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={currentQuestion === 0}
              onClick={() =>
                setCurrentQuestion((prev) => Math.max(0, prev - 1))
              }
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentQuestion >= questions.length - 1}
              onClick={() =>
                setCurrentQuestion((prev) =>
                  Math.min(questions.length - 1, prev + 1),
                )
              }
            >
              Next
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="lg:sticky lg:top-20"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const hasAnswer = Boolean(answers[q.id!]?.trim());
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestion(idx)}
                      className={`w-full aspect-square rounded-lg text-xs font-medium transition-all ${
                        idx === currentQuestion
                          ? "bg-primary text-white"
                          : hasAnswer
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-surface text-muted-foreground border border-border"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Answered</span>
                  <span className="font-medium">
                    {answeredCount} / {questions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Points</span>
                  <span className="font-medium">{totalPoints}</span>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={
                  answeredCount === 0 ||
                  questions.length === 0 ||
                  submitMutation.isPending
                }
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                )}
                Submit Assignment
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
