"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Clock,
  DollarSign,
  BookOpen,
  ArrowRight,
  Loader2,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { courseApi, courseTakenApi, type Course } from "@/lib/api";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function BrowsePage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: courseApi.getAll,
  });

  const { data: enrollments } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: () => courseTakenApi.getByUser(user!.id),
    enabled: !!user,
  });

  const enrolledCourseIds = new Set(enrollments?.map((e) => e.courseId) || []);

  const enrollMutation = useMutation({
    mutationFn: (course: Course) =>
      courseApi.buy(user!.id, course.id, Number(course.price)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments", user?.id] });
    },
  });

  const filteredCourses = courses?.filter(
    (course) =>
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.topics.some((t) =>
        t.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          Browse courses
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore our catalog and enroll in courses that interest you.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white"
          />
        </div>
      </motion.div>

      {/* Course grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredCourses && filteredCourses.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course, i) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <motion.div
                key={course.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <div className="h-full rounded-lg border border-border bg-white shadow-sm overflow-hidden flex flex-col">
                  <Link href={`/courses/${course.id}`}>
                    <div className="aspect-[16/9] bg-surface flex items-center justify-center cursor-pointer">
                      <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  </Link>
                  <div className="p-5 flex flex-col flex-1">
                    <Link href={`/courses/${course.id}`}>
                      <h3 className="text-sm font-semibold text-foreground mb-1.5 hover:text-primary transition-colors cursor-pointer">
                        {course.name}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {course.topics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="text-[11px] font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 mt-auto">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {course.duration}h
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        {course.price}
                      </div>
                    </div>
                    {isEnrolled ? (
                      <Button
                        className="w-full h-9"
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/dashboard/courses/${course.id}`}>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Open course
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        className="w-full h-9"
                        size="sm"
                        onClick={() => enrollMutation.mutate(course)}
                        disabled={enrollMutation.isPending}
                      >
                        {enrollMutation.isPending ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : null}
                        {enrollMutation.isPending ? "Enrolling..." : "Enroll now"}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-foreground mb-1">
            No courses found
          </h3>
          <p className="text-sm text-muted-foreground">
            {search
              ? `No courses match "${search}". Try a different search term.`
              : "No courses available yet. Check back soon."}
          </p>
        </div>
      )}
    </div>
  );
}
