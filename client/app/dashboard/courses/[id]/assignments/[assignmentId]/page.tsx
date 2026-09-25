"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { assignmentApi, submissionApi, type Assignment, type SubmissionResult } from "@/lib/api";
import { useSnackbar } from "@/components/snackbar-provider";
import { CodeEditor } from "@/components/code-editor";

export default function AssignmentTakePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const assignmentId = Number(params.assignmentId);
  const router = useRouter();
  const { toast } = useSnackbar();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: () => assignmentApi.getById(assignmentId),
    enabled: !!assignmentId,
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        answer,
      }));
      return submissionApi.submit(assignmentId, answerArray);
    },
    onSuccess: (data) => {
      setResult(data);
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
  const answeredCount = Object.keys(answers).length;

  if (loadingAssignment) {
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

  if (result) {
    const percentage = result.submission.totalPoints > 0
      ? Math.round((result.submission.score / result.submission.totalPoints) * 100)
      : 0;

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Link href={`/dashboard/courses/${courseId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-navy tracking-tight">Results: {assignment.title}</h1>
          </div>
        </motion.div>

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
                    {percentage}% correct
                  </p>
                  <div className="w-full h-2 bg-border rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
                  percentage >= 70 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}>
                  {percentage >= 70 ? "Passed" : "Failed"}
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
                key={ans.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + idx * 0.04 }}
              >
                <Card className={`border ${isCorrect ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"}`}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isCorrect ? "bg-emerald-100" : "bg-red-100"
                      }`}>
                        {isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-navy">
                          Q{idx + 1}. {ans.question?.questionText}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ans.pointsEarned} / {ans.question?.points || 1} points
                        </p>
                      </div>
                    </div>

                    {ans.question?.questionType === "mcq" && (
                      <div className="ml-9 space-y-1">
                        {ans.question.options.map((opt, oi) => {
                          const isSelected = ans.answer === String(oi);
                          const isCorrectOption = ans.question?.correctOptionIndex === oi;
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
                              {isCorrectOption && " ✓"}
                              {isSelected && !isCorrectOption && " ✗"}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {ans.question?.questionType === "true_false" && (
                      <div className="ml-9 space-y-1">
                        <p className="text-xs">
                          Your answer: <span className={isCorrect ? "text-emerald-600" : "text-red-600"}>
                            {ans.answer === "true" ? "True" : "False"}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-emerald-600">
                            Correct answer: {ans.question.correctAnswer === "true" ? "True" : "False"}
                          </p>
                        )}
                      </div>
                    )}

                    {ans.question?.questionType === "text_answer" && (
                      <div className="ml-9 space-y-1">
                        <p className="text-xs">
                          Your answer: <span className={isCorrect ? "text-emerald-600" : "text-red-600"}>
                            {ans.answer}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-emerald-600">
                            Expected: {ans.question.correctAnswer}
                          </p>
                        )}
                      </div>
                    )}

                    {ans.question?.questionType === "code" && (
                      <div className="ml-9 space-y-2">
                        <p className="text-xs">
                          Your answer: <span className={isCorrect ? "text-emerald-600" : "text-red-600"}>
                            {isCorrect ? "All test cases passed" : "Some test cases failed"}
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
                        <p className="text-[11px] text-blue-700">{ans.question.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-end">
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
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link href={`/dashboard/courses/${courseId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy tracking-tight">{assignment.title}</h1>
          {assignment.description && (
            <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
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
                        <span className="text-xs font-bold text-primary">Q{currentQuestion + 1}</span>
                        <span className="text-[10px] font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded">
                          Code Challenge
                        </span>
                        <span className="text-[10px] font-medium text-primary ml-auto">
                          {questions[currentQuestion].points || 1} pt{(questions[currentQuestion].points || 1) !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-navy">
                        {questions[currentQuestion].questionText}
                      </p>
                      <CodeEditor
                        code={answers[questions[currentQuestion].id!] || ""}
                        onChange={(value) => setAnswer(questions[currentQuestion].id!, value)}
                        language={questions[currentQuestion].codeLanguage || "javascript"}
                        testCases={questions[currentQuestion].testCases || []}
                      />
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">Q{currentQuestion + 1}</span>
                          <span className="text-[10px] font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded">
                            {questions[currentQuestion].questionType === "mcq" && "Multiple Choice"}
                            {questions[currentQuestion].questionType === "true_false" && "True / False"}
                            {questions[currentQuestion].questionType === "text_answer" && "Text Answer"}
                          </span>
                          <span className="text-[10px] font-medium text-primary ml-auto">
                            {questions[currentQuestion].points || 1} pt{(questions[currentQuestion].points || 1) !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-navy">
                          {questions[currentQuestion].questionText}
                        </p>

                        {questions[currentQuestion].questionType === "mcq" && (
                          <div className="space-y-2">
                            {questions[currentQuestion].options.map((opt, oi) => (
                              <button
                                key={oi}
                                onClick={() => setAnswer(questions[currentQuestion].id!, String(oi))}
                                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                                  answers[questions[currentQuestion].id!] === String(oi)
                                    ? "border-primary bg-primary/8 text-primary font-medium"
                                    : "border-border hover:bg-surface"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    answers[questions[currentQuestion].id!] === String(oi)
                                      ? "border-primary bg-primary"
                                      : "border-border"
                                  }`}>
                                    {answers[questions[currentQuestion].id!] === String(oi) && (
                                      <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                  </div>
                                  {opt}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {questions[currentQuestion].questionType === "true_false" && (
                          <div className="grid grid-cols-2 gap-3">
                            {["true", "false"].map((val) => (
                              <button
                                key={val}
                                onClick={() => setAnswer(questions[currentQuestion].id!, val)}
                                className={`px-4 py-6 rounded-lg border text-sm font-medium transition-all ${
                                  answers[questions[currentQuestion].id!] === val
                                    ? "border-primary bg-primary/8 text-primary"
                                    : "border-border hover:bg-surface"
                                }`}
                              >
                                {val === "true" ? "True" : "False"}
                              </button>
                            ))}
                          </div>
                        )}

                        {questions[currentQuestion].questionType === "text_answer" && (
                          <textarea
                            value={answers[questions[currentQuestion].id!] || ""}
                            onChange={(e) => setAnswer(questions[currentQuestion].id!, e.target.value)}
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
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentQuestion >= questions.length - 1}
              onClick={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
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
                  const hasAnswer = answers[q.id!] !== undefined;
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
                  <span className="font-medium">{answeredCount} / {questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total Points</span>
                  <span className="font-medium">{totalPoints}</span>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={answeredCount === 0 || submitMutation.isPending}
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
