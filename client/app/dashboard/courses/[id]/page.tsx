"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  FileText,
  Clock,
  Loader2,
  BookOpen,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/video-player";
import { courseApi, assignmentApi, progressApi, type Chapter, type ChapterProgress } from "@/lib/api";

export default function CoursePlayerPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [activeTab, setActiveTab] = useState<"chapters" | "assignments">(
    "chapters"
  );

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => courseApi.getById(courseId),
    enabled: !!courseId,
  });

  const { data: chapters, isLoading: loadingChapters } = useQuery({
    queryKey: ["chapters", courseId],
    queryFn: () => courseApi.getChapters(courseId),
    enabled: !!courseId,
  });

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ["assignments", activeChapter?.id],
    queryFn: () => assignmentApi.getByChapter(activeChapter!.id),
    enabled: !!activeChapter,
  });

  const { data: chapterProgress } = useQuery({
    queryKey: ["chapterProgress", courseId],
    queryFn: () => progressApi.getCourseProgress(courseId),
    enabled: !!courseId,
  });

  const sortedChapters = chapters
    ?.slice()
    .sort((a, b) => a.chapterNumber - b.chapterNumber);

  if (sortedChapters?.length && !activeChapter) {
    setActiveChapter(sortedChapters[0]);
  }

  const isLoading = loadingCourse || loadingChapters;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-muted-foreground">Course not found.</p>
        <Button variant="ghost" size="sm" asChild className="mt-4">
          <Link href="/dashboard/courses">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back to courses
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back + title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/dashboard/courses">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            My courses
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-navy tracking-tight">
              {course.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {course.topics.slice(0, 4).map((topic) => (
                <span
                  key={topic}
                  className="text-[11px] font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded border border-border"
                >
                  {topic}
                </span>
              ))}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {course.duration}h
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Player area: video + sidebar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="grid lg:grid-cols-[1fr_380px] gap-5 items-start"
      >
        {/* Left: video + info */}
        <div className="space-y-4">
          {/* Video */}
          <div className="rounded-lg border border-border overflow-hidden bg-navy shadow-sm relative">
            {activeChapter?.videoUrl ? (
              <VideoPlayer
                url={activeChapter.videoUrl}
                courseId={courseId}
                chapterId={activeChapter.id}
                initialTimeWatched={chapterProgress?.find((p) => p.chapterId === activeChapter.id)?.videoTimeWatched || 0}
                isVideoWatched={chapterProgress?.find((p) => p.chapterId === activeChapter.id)?.isVideoWatched || false}
                onVideoWatched={() => {}}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Play className="h-12 w-12 text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/40">
                    Select a chapter to start
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chapter info */}
          {activeChapter && (
            <div className="p-4 rounded-lg border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-navy">
                    {activeChapter.chapterName}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Chapter {activeChapter.chapterNumber} of{" "}
                    {sortedChapters?.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!activeChapter || activeChapter.chapterNumber <= 1}
                    onClick={() => {
                      if (!sortedChapters || !activeChapter) return;
                      const prev = sortedChapters.find(
                        (c) =>
                          c.chapterNumber === activeChapter.chapterNumber - 1
                      );
                      if (prev) setActiveChapter(prev);
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    disabled={
                      !activeChapter ||
                      !sortedChapters ||
                      activeChapter.chapterNumber >= sortedChapters.length ||
                      !chapterProgress?.find(
                        (p) => p.chapterId === sortedChapters.find(
                          (c) => c.chapterNumber === activeChapter.chapterNumber + 1
                        )?.id
                      )?.isCompleted
                    }
                    onClick={() => {
                      if (!sortedChapters || !activeChapter) return;
                      const next = sortedChapters.find(
                        (c) =>
                          c.chapterNumber === activeChapter.chapterNumber + 1
                      );
                      if (next) setActiveChapter(next);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: sidebar */}
        <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden lg:sticky lg:top-20">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("chapters")}
              className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === "chapters"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <BookOpen className="inline h-3.5 w-3.5 mr-1.5" />
              Chapters
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeTab === "assignments"
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <FileText className="inline h-3.5 w-3.5 mr-1.5" />
              Assignments
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[480px] overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === "chapters" ? (
                <motion.div
                  key="chapters"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="p-2"
                >
                  {sortedChapters?.map((chapter, idx) => {
                    const isActive = activeChapter?.id === chapter.id;
                    const progress = chapterProgress?.find((p) => p.chapterId === chapter.id);
                    const isCompleted = progress?.isCompleted || false;
                    const isLocked = !isCompleted && chapter.chapterNumber > 1 &&
                      !chapterProgress?.find(
                        (p) => p.chapterId === sortedChapters.find(
                          (c) => c.chapterNumber === chapter.chapterNumber - 1
                        )?.id
                      )?.isCompleted;
                    return (
                      <button
                        key={chapter.id}
                        onClick={() => {
                          if (!isLocked) setActiveChapter(chapter);
                        }}
                        disabled={isLocked}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
                          isLocked
                            ? "opacity-50 cursor-not-allowed"
                            : isActive
                            ? "bg-primary/8 border border-primary/20"
                            : "hover:bg-surface border border-transparent"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isActive
                              ? "bg-primary text-white"
                              : isCompleted
                              ? "bg-emerald-100 text-emerald-600"
                              : isLocked
                              ? "bg-surface text-muted-foreground border border-border"
                              : "bg-surface text-muted-foreground border border-border"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : isLocked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            chapter.chapterNumber
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium truncate ${
                              isActive ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {chapter.chapterName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {isLocked ? "Complete previous chapter to unlock" : `Chapter ${chapter.chapterNumber}`}
                          </p>
                        </div>
                        {isActive && (
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Play className="h-2.5 w-2.5 text-primary ml-0.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {!sortedChapters?.length && (
                    <div className="px-4 py-10 text-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No chapters available.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="assignments"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="p-2"
                >
                  {loadingAssignments ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : assignments?.length ? (
                    <div className="space-y-1">
                      {assignments.map((assignment, idx) => (
                        <Link
                          key={assignment.id}
                          href={`/dashboard/courses/${courseId}/assignments/${assignment.id}`}
                          className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {assignment.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {assignment.questions.length} question{assignment.questions.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-10 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {activeChapter
                          ? "No assignments for this chapter."
                          : "Select a chapter to view assignments."}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress footer */}
          {sortedChapters && sortedChapters.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-surface/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Course progress
                </span>
                <span className="text-[11px] font-semibold text-foreground">
                  {chapterProgress?.filter((p) => p.isCompleted).length || 0} / {sortedChapters.length} chapters
                </span>
              </div>
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${((chapterProgress?.filter((p) => p.isCompleted).length || 0) / sortedChapters.length) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
