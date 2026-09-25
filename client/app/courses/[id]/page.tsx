"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  BookOpen,
  Loader2,
  Play,
  FileText,
  CheckCircle2,
  Users,
  Star,
  Award,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useSnackbar } from "@/components/snackbar-provider";
import {
  courseApi,
  instructorApi,
  assignmentApi,
  type Chapter,
} from "@/lib/api";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useSnackbar();

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

  const { data: instructor } = useQuery({
    queryKey: ["instructor", course?.instructorId],
    queryFn: () => instructorApi.getById(course!.instructorId!),
    enabled: !!course?.instructorId,
  });

  const enrollMutation = useMutation({
    mutationFn: () => courseApi.buy(user!.id, courseId, Number(course!.price)),
    onSuccess: () => {
      toast("Successfully enrolled!", "success");
      queryClient.invalidateQueries({ queryKey: ["enrollments", user?.id] });
      router.push(`/dashboard/courses/${courseId}`);
    },
    onError: () => {
      toast("Failed to enroll. Please try again.", "error");
    },
  });

  const sortedChapters = chapters
    ?.slice()
    .sort((a, b) => a.chapterNumber - b.chapterNumber);

  const isLoading = loadingCourse || loadingChapters;

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-[1200px] px-6 py-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link href="/courses">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              All courses
            </Link>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1200px] px-6 py-8 md:py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : course ? (
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Left: course info + chapters */}
            <div className="space-y-8">
              {/* Course header */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {course.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-[11px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-navy tracking-tight leading-tight mb-4">
                  {course.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {course.duration} hours
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    {sortedChapters?.length || 0} chapters
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    All levels
                  </span>
                </div>
              </motion.div>

              {/* Course content / chapters */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.06 }}
              >
                <h2 className="text-lg font-bold text-navy tracking-tight mb-1">
                  Course content
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {sortedChapters?.length || 0} chapters · {course.duration}h total
                </p>

                {loadingChapters ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : sortedChapters && sortedChapters.length > 0 ? (
                  <div className="space-y-2">
                    {sortedChapters.map((chapter, i) => (
                      <ChapterItem
                        key={chapter.id}
                        chapter={chapter}
                        index={i}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 rounded-lg border border-border bg-white shadow-sm">
                    <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No chapters available yet.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right: sticky enroll card + instructor */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="lg:sticky lg:top-20 space-y-4"
            >
              {/* Price card */}
              <div className="rounded-lg border border-border bg-white shadow-sm overflow-hidden">
                <div className="aspect-[16/9] bg-navy flex items-center justify-center">
                  <Play className="h-14 w-14 text-white/40" />
                </div>
                <div className="p-5">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-navy">
                      ${course.price}
                    </span>
                  </div>
                  <Button
                    className="w-full h-10 mb-3"
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push("/auth");
                        return;
                      }
                      enrollMutation.mutate();
                    }}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : null}
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll now"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    30-day money-back guarantee
                  </p>
                  <div className="mt-5 pt-5 border-t border-border space-y-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      Full lifetime access
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      Certificate of completion
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {sortedChapters?.length || 0} chapters
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructor card */}
              {instructor && (
                <div className="rounded-lg border border-border bg-white shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-navy mb-4">
                    About the instructor
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {instructor.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {instructor.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {instructor.headline}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      4.9
                    </div>
                  </div>
                  {instructor.bio && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {instructor.bio}
                    </p>
                  )}
                  <div className="space-y-2.5">
                    {instructor.expertise && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-foreground">{instructor.expertise}</span>
                      </div>
                    )}
                    {instructor.experienceYears != null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-foreground">
                          {instructor.experienceYears} years experience
                        </span>
                      </div>
                    )}
                    {instructor.website && (
                      <a
                        href={instructor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Globe className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-foreground">Website</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    )}
                    {instructor.linkedin && (
                      <a
                        href={instructor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Globe className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-foreground">LinkedIn</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    )}
                    {instructor.github && (
                      <a
                        href={instructor.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <Globe className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-foreground">GitHub</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Course not found.</p>
        )}
      </div>
    </div>
  );
}

function ChapterItem({
  chapter,
  index,
}: {
  chapter: Chapter;
  index: number;
}) {
  const { data: assignments } = useQuery({
    queryKey: ["assignments", chapter.id],
    queryFn: () => assignmentApi.getByChapter(chapter.id),
  });

  return (
    <motion.div
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20px" }}
      variants={fadeIn}
      className="rounded-lg border border-border bg-white shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-9 h-9 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-primary">
            {chapter.chapterNumber}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {chapter.chapterName}
          </h3>
          {assignments && assignments.length > 0 && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <FileText className="h-3 w-3" />
              {assignments.length} assignment{assignments.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <Play className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      </div>

      {assignments && assignments.length > 0 && (
        <div className="border-t border-border bg-surface/50 px-5 py-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Assignments
          </p>
          <div className="space-y-1.5">
            {assignments.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                <span className="text-foreground">Assignment {i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
