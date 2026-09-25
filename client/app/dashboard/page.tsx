"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  ArrowRight,
  Compass,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { courseTakenApi, courseApi, type Course } from "@/lib/api";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function DashboardPage() {
  const { user } = useUser();

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: () => courseTakenApi.getByUser(user!.id),
    enabled: !!user,
  });

  const { data: allCourses, isLoading: loadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: courseApi.getAll,
  });

  const enrolledCourses =
    enrollments
      ?.map((e) => allCourses?.find((c) => c.id === e.courseId))
      .filter(Boolean) as Course[] | undefined;

  const totalHours =
    enrolledCourses?.reduce((sum, c) => sum + Number(c.duration), 0) || 0;

  const isLoading = loadingEnrollments || loadingCourses;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick up where you left off or explore something new.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="p-4 rounded-lg border border-border bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy">
            {isLoading ? "—" : enrolledCourses?.length || 0}
          </p>
          <p className="text-xs text-muted-foreground">Enrolled courses</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy">
            {isLoading ? "—" : totalHours}h
          </p>
          <p className="text-xs text-muted-foreground">Total hours</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-navy">—</p>
          <p className="text-xs text-muted-foreground">Certificates</p>
        </div>
      </motion.div>

      {/* Continue learning */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy">Continue learning</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/courses">
              View all
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : enrolledCourses && enrolledCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {enrolledCourses.slice(0, 3).map((course, i) => (
              <motion.div
                key={course.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <Link href={`/dashboard/courses/${course.id}`}>
                  <div className="group rounded-lg border border-border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-[16/9] bg-surface flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {course.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {course.topics.slice(0, 2).map((topic) => (
                          <span
                            key={topic}
                            className="text-[10px] font-medium text-muted-foreground bg-surface px-1.5 py-0.5 rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {course.duration}h total
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-lg border border-border bg-white shadow-sm">
            <Compass className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No courses yet
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Browse our catalog and enroll in your first course.
            </p>
            <Button size="sm" asChild>
              <Link href="/dashboard/browse">
                Browse courses
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
        className="grid sm:grid-cols-2 gap-3"
      >
        <Link href="/dashboard/browse">
          <div className="group p-5 rounded-lg border border-border bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              Browse courses
            </h3>
            <p className="text-xs text-muted-foreground">
              Discover new skills and topics to learn.
            </p>
          </div>
        </Link>
        <Link href="/dashboard/profile">
          <div className="group p-5 rounded-lg border border-border bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
              Your profile
            </h3>
            <p className="text-xs text-muted-foreground">
              Update your account information.
            </p>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
