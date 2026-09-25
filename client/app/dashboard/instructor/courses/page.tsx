"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { instructorCourseApi, type InstructorCourseWithStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Users,
  DollarSign,
  BookOpen,
  Clock,
  ArrowRight,
  BarChart3,
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function InstructorCoursesPage() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["instructor", "courses"],
    queryFn: instructorCourseApi.getMyCourses,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your courses and track performance
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/dashboard/instructor/create">
            <Plus className="h-4 w-4" />
            New Course
          </Link>
        </Button>
      </motion.div>

      {courses && courses.length > 0 ? (
        <>
          {/* Summary stats */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="p-4 rounded-lg border border-border bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-navy">{courses.length}</p>
              <p className="text-xs text-muted-foreground">Total courses</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-navy">
                {courses.reduce((sum, c) => sum + c.enrollmentCount, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total students</p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-white shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-navy">
                ${courses.reduce((sum, c) => sum + Number(c.revenue), 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Total revenue</p>
            </div>
          </motion.div>

          {/* Course list */}
          <div className="grid gap-4">
            {courses.map((course, i) => (
              <motion.div
                key={course.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <Link href={`/dashboard/instructor/courses/${course.id}`}>
                  <div className="group flex items-center gap-5 p-5 rounded-xl border border-border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer">
                    <div className="w-16 h-16 rounded-lg bg-surface flex items-center justify-center shrink-0">
                      <BookOpen className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {course.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {course.topics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="outline" className="text-[10px] font-medium">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.enrollmentCount} students
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${Number(course.revenue).toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duration}h
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="text-center py-16 rounded-xl border border-dashed border-border bg-white"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-7 w-7 text-primary/50" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No courses yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            Create your first course and start sharing your knowledge with learners.
          </p>
          <Button asChild className="gap-1.5">
            <Link href="/dashboard/instructor/create">
              <Plus className="h-4 w-4" />
              Create your first course
            </Link>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
