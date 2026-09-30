"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { chapterApi, assignmentApi, instructorCourseApi, type Chapter, type Assignment, type AssignmentQuestion } from "@/lib/api";
import { useSnackbar } from "@/components/snackbar-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  Plus,
  PlayCircle,
  GripVertical,
  Trash2,
  X,
  Video,
  ImagePlus,
  Pencil,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  ListChecks,
  Code,
  Type,
  ToggleLeft,
  CircleDot,
} from "lucide-react";

const chapterSchema = z.object({
  chapterName: z.string().min(2, { message: "Chapter name must be at least 2 characters" }).max(255),
  chapterNumber: z.number({ message: "Chapter number is required" }).int().positive(),
  thumbnail: z.any().refine((v) => v instanceof File || (typeof v === "string" && v.length > 0), { message: "Thumbnail is required" }),
  videoUrl: z.any().refine((v) => v instanceof File || (typeof v === "string" && v.length > 0), { message: "Video is required" }),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

const assignmentSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }).max(255),
  description: z.string().optional(),
  questions: z.array(z.object({
    questionText: z.string().min(1, { message: "Question text is required" }),
    options: z.array(z.string().min(1)).min(2, { message: "At least 2 options required" }),
    correctOptionIndex: z.number().int().min(0),
    questionType: z.enum(["mcq", "true_false", "text_answer", "code"]).optional(),
    correctAnswer: z.string().optional(),
    codeLanguage: z.enum(["javascript", "python", "java", "cpp"]).optional(),
    testCases: z.array(z.object({
      input: z.string(),
      expectedOutput: z.string(),
      hidden: z.boolean().optional(),
    })).optional(),
    points: z.number().int().positive().optional(),
    explanation: z.string().optional(),
  })).optional(),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

type QuestionDraft = {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  questionType: "mcq" | "true_false" | "text_answer" | "code";
  correctAnswer: string;
  codeLanguage: "javascript" | "python" | "java" | "cpp";
  testCases: { input: string; expectedOutput: string; hidden?: boolean }[];
  points: number;
  explanation: string;
};

function AssignmentManager({ chapterId }: { chapterId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useSnackbar();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Assignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["assignments", chapterId],
    queryFn: () => assignmentApi.getByChapter(chapterId),
  });

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { title: "", description: "", questions: [] },
  });

  const createMutation = useMutation({
    mutationFn: (data: AssignmentFormData) => assignmentApi.create(chapterId, { ...data, questions: questions.length > 0 ? questions.map((q) => ({
      questionText: q.questionText,
        options: q.questionType === "true_false" ? ["True", "False"] : q.questionType === "mcq" ? q.options.filter((o) => o.trim() !== "") : [],
      correctOptionIndex: q.questionType === "true_false" ? (q.correctAnswer === "true" ? 0 : 1) : q.correctOptionIndex,
      questionType: q.questionType,
      correctAnswer: q.correctAnswer || undefined,
      codeLanguage: q.codeLanguage || undefined,
      testCases: q.questionType === "code" ? q.testCases : undefined,
      points: q.points,
      explanation: q.explanation || undefined,
    })) : undefined }),
    onSuccess: () => {
      toast("Assignment created!", "success");
      queryClient.invalidateQueries({ queryKey: ["assignments", chapterId] });
      setShowForm(false);
      form.reset();
      setQuestions([]);
    },
    onError: () => toast("Failed to create assignment.", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: AssignmentFormData) => {
      if (!editTarget) return Promise.reject("No target");
      return assignmentApi.update(chapterId, editTarget.id, { ...data, questions: questions.length > 0 ? questions.map((q) => ({
        questionText: q.questionText,
      options: q.questionType === "true_false" ? ["True", "False"] : q.questionType === "mcq" ? q.options.filter((o) => o.trim() !== "") : [],
        correctOptionIndex: q.questionType === "true_false" ? (q.correctAnswer === "true" ? 0 : 1) : q.correctOptionIndex,
        questionType: q.questionType,
        correctAnswer: q.correctAnswer || undefined,
        codeLanguage: q.codeLanguage || undefined,
        testCases: q.questionType === "code" ? q.testCases : undefined,
        points: q.points,
        explanation: q.explanation || undefined,
      })) : undefined });
    },
    onSuccess: () => {
      toast("Assignment updated!", "success");
      queryClient.invalidateQueries({ queryKey: ["assignments", chapterId] });
      setEditTarget(null);
      form.reset();
      setQuestions([]);
    },
    onError: () => toast("Failed to update assignment.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (assignmentId: number) => assignmentApi.delete(chapterId, assignmentId),
    onSuccess: () => {
      toast("Assignment deleted.", "info");
      queryClient.invalidateQueries({ queryKey: ["assignments", chapterId] });
      setDeleteTarget(null);
    },
    onError: () => toast("Failed to delete assignment.", "error"),
  });

  const startEdit = (assignment: Assignment) => {
    setEditTarget(assignment);
    setQuestions(assignment.questions.map((q) => ({
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      questionType: (q.questionType as QuestionDraft["questionType"]) || "mcq",
      correctAnswer: q.correctAnswer || "",
      codeLanguage: (q.codeLanguage as QuestionDraft["codeLanguage"]) || "javascript",
      testCases: q.testCases || [],
      points: q.points || 1,
      explanation: q.explanation || "",
    })));
    form.reset({ title: assignment.title, description: assignment.description || "" });
    setShowForm(true);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      questionText: "",
      options: ["", ""],
      correctOptionIndex: 0,
      questionType: "mcq",
      correctAnswer: "",
      codeLanguage: "javascript",
      testCases: [{ input: "", expectedOutput: "", hidden: false }],
      points: 1,
      explanation: "",
    }]);
  };

  const updateQuestion = (index: number, field: keyof QuestionDraft, value: any) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options = [...updated[questionIndex].options, ""];
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options[optionIndex] = value;
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex);
    if (updated[questionIndex].correctOptionIndex >= updated[questionIndex].options.length) {
      updated[questionIndex].correctOptionIndex = 0;
    }
    setQuestions(updated);
  };

  const addTestCase = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].testCases = [...updated[questionIndex].testCases, { input: "", expectedOutput: "", hidden: false }];
    setQuestions(updated);
  };

  const updateTestCase = (questionIndex: number, testCaseIndex: number, field: "input" | "expectedOutput" | "hidden", value: any) => {
    const updated = [...questions];
    (updated[questionIndex].testCases[testCaseIndex] as any)[field] = value;
    setQuestions(updated);
  };

  const removeTestCase = (questionIndex: number, testCaseIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].testCases = updated[questionIndex].testCases.filter((_, i) => i !== testCaseIndex);
    setQuestions(updated);
  };

  const onSubmit = (data: AssignmentFormData) => {
    if (editTarget) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mt-2 ml-12 border-l-2 border-border pl-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignments</p>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1"
          onClick={() => { setShowForm(!showForm); setEditTarget(null); form.reset(); setQuestions([]); }}
        >
          {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showForm ? "Cancel" : "Add Assignment"}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  {editTarget ? <Pencil className="h-3.5 w-3.5 text-primary" /> : <Plus className="h-3.5 w-3.5 text-primary" />}
                  {editTarget ? "Edit Assignment" : "New Assignment"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Title</Label>
                    <Input placeholder="e.g. React Fundamentals Quiz" {...form.register("title")} />
                    {form.formState.errors.title && (
                      <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Description (optional)</Label>
                    <Input placeholder="Brief description of this assignment" {...form.register("description")} />
                  </div>

                  {/* Questions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        Questions ({questions.length})
                      </Label>
                      <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addQuestion}>
                        <Plus className="h-3 w-3" /> Add Question
                      </Button>
                    </div>

                    {questions.map((q, qi) => (
                      <div key={qi} className="p-3 rounded-lg border border-border bg-surface/30 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">Q{qi + 1}</span>
                          <Input
                            placeholder="Enter question text"
                            value={q.questionText}
                            onChange={(e) => updateQuestion(qi, "questionText", e.target.value)}
                            className="h-8 text-sm"
                          />
                          <select
                            value={q.questionType}
                            onChange={(e) => updateQuestion(qi, "questionType", e.target.value)}
                            className="h-8 text-xs rounded-md border border-border bg-white px-2"
                          >
                            <option value="mcq">MCQ</option>
                            <option value="true_false">True/False</option>
                            <option value="text_answer">Text Answer</option>
                            <option value="code">Code</option>
                          </select>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeQuestion(qi)}>
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 ml-6">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Points:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={q.points}
                            onChange={(e) => updateQuestion(qi, "points", parseInt(e.target.value) || 1)}
                            className="h-7 w-16 text-xs"
                          />
                          <Label className="text-xs text-muted-foreground whitespace-nowrap ml-2">Explanation:</Label>
                          <Input
                            placeholder="Optional explanation"
                            value={q.explanation}
                            onChange={(e) => updateQuestion(qi, "explanation", e.target.value)}
                            className="h-7 text-xs flex-1"
                          />
                        </div>

                        {q.questionType === "mcq" && (
                          <div className="space-y-1.5 ml-6">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${qi}`}
                                  checked={q.correctOptionIndex === oi}
                                  onChange={() => updateQuestion(qi, "correctOptionIndex", oi)}
                                  className="h-3.5 w-3.5 text-primary"
                                />
                                <Input
                                  placeholder={`Option ${oi + 1}`}
                                  value={opt}
                                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                                  className="h-7 text-xs"
                                />
                                {q.options.length > 2 && (
                                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeOption(qi, oi)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => addOption(qi)}>
                              <Plus className="h-2.5 w-2.5" /> Add Option
                            </Button>
                          </div>
                        )}

                        {q.questionType === "true_false" && (
                          <div className="space-y-1.5 ml-6">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-xs">
                                <input
                                  type="radio"
                                  name={`tf-${qi}`}
                                  checked={q.correctAnswer === "true"}
                                  onChange={() => updateQuestion(qi, "correctAnswer", "true")}
                                  className="h-3.5 w-3.5 text-primary"
                                />
                                True
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                                <input
                                  type="radio"
                                  name={`tf-${qi}`}
                                  checked={q.correctAnswer === "false"}
                                  onChange={() => updateQuestion(qi, "correctAnswer", "false")}
                                  className="h-3.5 w-3.5 text-primary"
                                />
                                False
                              </label>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Select the correct answer</p>
                          </div>
                        )}

                        {q.questionType === "text_answer" && (
                          <div className="space-y-1.5 ml-6">
                            <Label className="text-xs text-muted-foreground">Expected answer (case-insensitive)</Label>
                            <Input
                              placeholder="Enter the expected answer"
                              value={q.correctAnswer}
                              onChange={(e) => updateQuestion(qi, "correctAnswer", e.target.value)}
                              className="h-7 text-xs"
                            />
                          </div>
                        )}

                        {q.questionType === "code" && (
                          <div className="space-y-2 ml-6">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Language:</Label>
                              <select
                                value={q.codeLanguage}
                                onChange={(e) => updateQuestion(qi, "codeLanguage", e.target.value)}
                                className="h-7 text-xs rounded-md border border-border bg-white px-2"
                              >
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">Test Cases</Label>
                                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => addTestCase(qi)}>
                                  <Plus className="h-2.5 w-2.5" /> Add Test Case
                                </Button>
                              </div>
                              {q.testCases.map((tc, tci) => (
                                <div key={tci} className="p-2 rounded border border-border bg-white/50 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium text-muted-foreground">#{tci + 1}</span>
                                    <label className="flex items-center gap-1 text-[10px]">
                                      <input
                                        type="checkbox"
                                        checked={tc.hidden}
                                        onChange={(e) => updateTestCase(qi, tci, "hidden", e.target.checked)}
                                        className="h-3 w-3"
                                      />
                                      Hidden
                                    </label>
                                    {q.testCases.length > 1 && (
                                      <Button type="button" variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => removeTestCase(qi, tci)}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-[10px] text-muted-foreground">Input</Label>
                                      <textarea
                                        value={tc.input}
                                        onChange={(e) => updateTestCase(qi, tci, "input", e.target.value)}
                                        className="w-full h-16 text-[10px] font-mono rounded border border-border p-1.5 resize-none"
                                        placeholder="Input"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-[10px] text-muted-foreground">Expected Output</Label>
                                      <textarea
                                        value={tc.expectedOutput}
                                        onChange={(e) => updateTestCase(qi, tci, "expectedOutput", e.target.value)}
                                        className="w-full h-16 text-[10px] font-mono rounded border border-border p-1.5 resize-none"
                                        placeholder="Expected output"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-3.5 w-3.5" />
                      )}
                      {editTarget ? "Update" : "Create"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditTarget(null); form.reset(); setQuestions([]); }}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {assignments && assignments.length > 0 ? (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-white/50 hover:bg-white transition-colors group">
              <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                <FileText className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{assignment.title}</p>
                <p className="text-xs text-muted-foreground">
                  {assignment.questions.length} question{assignment.questions.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => startEdit(assignment)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={() => setDeleteTarget(assignment)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="text-center py-4">
            <ListChecks className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No assignments yet</p>
          </div>
        )
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Assignment"
        description={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

export default function ChaptersPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const queryClient = useQueryClient();
  const { toast } = useSnackbar();
  const [showForm, setShowForm] = useState(false);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Chapter | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: course } = useQuery({
    queryKey: ["instructor", "course", courseId],
    queryFn: () => instructorCourseApi.getMyCourseDetail(courseId),
    enabled: !!courseId,
  });

  const { data: chapters, isLoading } = useQuery({
    queryKey: ["chapters", courseId],
    queryFn: () => chapterApi.getByCourse(courseId),
    enabled: !!courseId,
  });

  const form = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      chapterName: "",
      chapterNumber: (chapters?.length || 0) + 1,
      thumbnail: null,
      videoUrl: null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ChapterFormData) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("chapterName", data.chapterName);
        formData.append("chapterNumber", String(data.chapterNumber));
        if (thumbFile) formData.append("thumbnail", thumbFile);
        if (videoFile) formData.append("video", videoFile);
        return await chapterApi.create(courseId, formData);
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      toast("Chapter added successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ["chapters", courseId] });
      queryClient.invalidateQueries({ queryKey: ["instructor", "course", courseId] });
      setShowForm(false);
      setThumbFile(null);
      setVideoFile(null);
      setThumbPreview(null);
      setVideoPreview(null);
      form.reset({ chapterName: "", chapterNumber: (chapters?.length || 0) + 2, thumbnail: null, videoUrl: null });
    },
    onError: () => toast("Failed to add chapter. Please try again.", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ChapterFormData) => {
      if (!editChapter) return Promise.reject("No chapter");
      return chapterApi.update(courseId, editChapter.id, data);
    },
    onSuccess: () => {
      toast("Chapter updated successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ["chapters", courseId] });
      queryClient.invalidateQueries({ queryKey: ["instructor", "course", courseId] });
      setEditChapter(null);
      setShowForm(false);
      form.reset();
    },
    onError: () => toast("Failed to update chapter.", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (chapterId: number) => chapterApi.delete(courseId, chapterId),
    onSuccess: () => {
      toast("Chapter deleted.", "info");
      queryClient.invalidateQueries({ queryKey: ["chapters", courseId] });
      queryClient.invalidateQueries({ queryKey: ["instructor", "course", courseId] });
      setDeleteTarget(null);
    },
    onError: () => toast("Failed to delete chapter.", "error"),
  });

  const startEditChapter = (chapter: Chapter) => {
    setEditChapter(chapter);
    setThumbFile(null);
    setVideoFile(null);
    setThumbPreview(chapter.thumbnail || null);
    setVideoPreview(chapter.videoUrl || null);
    form.reset({
      chapterName: chapter.chapterName,
      chapterNumber: chapter.chapterNumber,
      thumbnail: chapter.thumbnail,
      videoUrl: chapter.videoUrl,
    });
    setShowForm(true);
  };

  const toggleExpand = (chapterId: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const onSubmit = (data: ChapterFormData) => {
    if (editChapter) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link href={`/dashboard/instructor/courses/${courseId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy tracking-tight">Chapters</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {course?.name || "Loading course..."}
          </p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditChapter(null); setThumbFile(null); setVideoFile(null); setThumbPreview(null); setVideoPreview(null); form.reset({ chapterName: "", chapterNumber: (chapters?.length || 0) + 1, thumbnail: null, videoUrl: null }); }} className="gap-1.5" size="sm">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Chapter"}
        </Button>
      </motion.div>

      {/* Add/Edit chapter form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {editChapter ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
                  {editChapter ? "Edit Chapter" : "New Chapter"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid sm:grid-cols-[1fr_120px] gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="chapterName" className="text-sm font-medium">Chapter name</Label>
                      <Input id="chapterName" placeholder="e.g. Introduction to React Hooks" {...form.register("chapterName")} className={form.formState.errors.chapterName ? "border-destructive" : ""} />
                      {form.formState.errors.chapterName && <p className="text-xs text-destructive">{form.formState.errors.chapterName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="chapterNumber" className="text-sm font-medium">Number</Label>
                      <Input id="chapterNumber" type="number" {...form.register("chapterNumber", { valueAsNumber: true })} className={form.formState.errors.chapterNumber ? "border-destructive" : ""} />
                      {form.formState.errors.chapterNumber && <p className="text-xs text-destructive">{form.formState.errors.chapterNumber.message}</p>}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" /> Thumbnail
                      </Label>
                      {thumbPreview ? (
                        <div className="relative rounded-lg overflow-hidden border border-border bg-surface/30">
                          <img
                            src={thumbPreview}
                            alt="Thumbnail preview"
                            className="w-full h-48 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setThumbFile(null);
                              setThumbPreview(null);
                              form.setValue("thumbnail", null, { shouldValidate: true });
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-border bg-surface/30 hover:bg-surface/50 cursor-pointer transition-colors">
                          <ImagePlus className="h-8 w-8 text-muted-foreground/40 mb-2" />
                          <span className="text-xs text-muted-foreground">Click to upload thumbnail</span>
                          <span className="text-[10px] text-muted-foreground/60 mt-1">PNG, JPG, WEBP</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (file) {
                                setThumbFile(file);
                                setThumbPreview(URL.createObjectURL(file));
                                form.setValue("thumbnail", file, { shouldValidate: true });
                              }
                            }}
                          />
                        </label>
                      )}
                      {form.formState.errors.thumbnail && <p className="text-xs text-destructive">{String(form.formState.errors.thumbnail.message)}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-muted-foreground" /> Video
                      </Label>
                      {videoPreview ? (
                        <div className="relative rounded-lg overflow-hidden border border-border bg-surface/30">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full h-48 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setVideoFile(null);
                              setVideoPreview(null);
                              form.setValue("videoUrl", null, { shouldValidate: true });
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-border bg-surface/30 hover:bg-surface/50 cursor-pointer transition-colors">
                          <Video className="h-8 w-8 text-muted-foreground/40 mb-2" />
                          <span className="text-xs text-muted-foreground">Click to upload video</span>
                          <span className="text-[10px] text-muted-foreground/60 mt-1">MP4, WEBM, MOV</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (file) {
                                setVideoFile(file);
                                setVideoPreview(URL.createObjectURL(file));
                                form.setValue("videoUrl", file, { shouldValidate: true });
                              }
                            }}
                          />
                        </label>
                      )}
                      {form.formState.errors.videoUrl && <p className="text-xs text-destructive">{String(form.formState.errors.videoUrl.message)}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending || uploading}>
                      {(createMutation.isPending || updateMutation.isPending || uploading) ? (
                        <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> {uploading ? "Uploading files..." : editChapter ? "Updating..." : "Adding..."}</>
                      ) : (
                        <><Check className="mr-1 h-3.5 w-3.5" /> {editChapter ? "Update Chapter" : "Add Chapter"}</>
                      )}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditChapter(null); setThumbFile(null); setVideoFile(null); setThumbPreview(null); setVideoPreview(null); form.reset(); }}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : chapters && chapters.length > 0 ? (
        <div className="space-y-2">
          {chapters.map((chapter, i) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-2 shrink-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{chapter.chapterNumber}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{chapter.chapterName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <PlayCircle className="h-3 w-3" /> Video
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ImagePlus className="h-3 w-3" /> Thumbnail
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => toggleExpand(chapter.id)}
                >
                  {expandedChapters.has(chapter.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => startEditChapter(chapter)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(chapter)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Assignment manager */}
              <AnimatePresence>
                {expandedChapters.has(chapter.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <AssignmentManager chapterId={chapter.id} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 rounded-xl border border-dashed border-border bg-white"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="h-7 w-7 text-primary/50" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No chapters yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            Start adding chapters with video content to build your course.
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add first chapter
          </Button>
        </motion.div>
      )}

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Chapter"
        description={`Are you sure you want to delete "${deleteTarget?.chapterName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
