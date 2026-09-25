"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, BookOpen, ArrowRight, Compass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { courseTakenApi, courseApi, type Course } from "@/lib/api";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function MyCoursesPage() {
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

  const enrolledCourses = enrollments
    ?.map((e) => ({
      enrollment: e,
      course: allCourses?.find((c) => c.id === e.courseId),
    }))
    .filter((item) => item.course) as
    | { enrollment: (typeof enrollments extends (infer T)[] ? T : never); course: Course }[]
    | undefined;

  const isLoading = loadingEnrollments || loadingCourses;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          My courses
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Courses you&apos;ve enrolled in.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : enrolledCourses && enrolledCourses.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {enrolledCourses.map((item, i) => (
            <motion.div
              key={item.course.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
            >
              <Link href={`/dashboard/courses/${item.course.id}`}>
                <div className="group rounded-lg border border-border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-[16/9] bg-surface flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {item.course.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.course.topics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="text-[11px] font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {item.course.duration}h total
                      </div>
                      <span className="text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-1.5 transition-all">
                        Open course
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center py-20 rounded-lg border border-border bg-white shadow-sm"
        >
          <Compass className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            No courses yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            You haven&apos;t enrolled in any courses yet. Browse our catalog to
            find something you&apos;d like to learn.
          </p>
          <Button asChild>
            <Link href="/dashboard/browse">
              Browse courses
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      )}
    </div>
  );
}
