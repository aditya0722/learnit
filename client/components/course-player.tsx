"use client";

import { Play, CheckCircle2, Clock, BookOpen } from "lucide-react";

const lessons = [
  { title: "Introduction to React Hooks", duration: "12:30", completed: true },
  { title: "Understanding useState", duration: "18:45", completed: true },
  { title: "useEffect Deep Dive", duration: "22:10", completed: false, active: true },
  { title: "Custom Hooks Pattern", duration: "15:20", completed: false },
  { title: "useContext for State", duration: "19:00", completed: false },
];

export default function CoursePlayer() {
  const completedCount = lessons.filter((l) => l.completed).length;
  const progress = (completedCount / lessons.length) * 100;

  return (
    <div className="w-full max-w-lg">
      {/* Main player card */}
      <div className="rounded-xl border border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Video area */}
        <div className="relative aspect-video bg-navy flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-navy-light/50 to-navy" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/25 transition-colors">
              <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
            </div>
            <span className="text-white/70 text-xs font-medium">
              Lesson 3 of {lessons.length}
            </span>
          </div>
          {/* Duration badge */}
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/50 text-white text-[11px] font-medium backdrop-blur-sm">
            22:10
          </div>
        </div>

        {/* Course info */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] font-medium text-primary uppercase tracking-wider mb-1">
                React Masterclass
              </p>
              <h3 className="text-base font-semibold text-foreground leading-snug">
                useEffect Deep Dive
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                by Sarah Johnson
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {completedCount} of {lessons.length} completed
              </span>
              <span className="text-xs font-medium text-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Continue button */}
          <button className="w-full h-9 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            Continue learning
          </button>
        </div>
      </div>

      {/* Lesson list */}
      <div className="mt-3 rounded-xl border border-border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Course content
          </h4>
        </div>
        <div className="divide-y divide-border">
          {lessons.map((lesson, i) => (
            <div
              key={lesson.title}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                lesson.active
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="shrink-0">
                {lesson.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : lesson.active ? (
                  <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                ) : (
                  <span className="block h-4 w-4 text-center text-[11px] text-muted-foreground font-medium leading-4">
                    {i + 1}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-snug truncate ${
                    lesson.active
                      ? "font-medium text-foreground"
                      : lesson.completed
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {lesson.title}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{lesson.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
