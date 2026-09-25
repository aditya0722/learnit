"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Clock,
  DollarSign,
  BookOpen,
  ArrowRight,
  Loader2,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";
import { useState } from "react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

interface Course {
  id: number;
  name: string;
  topics: string[];
  duration: number;
  price: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { default: api } = await import("@/lib/api");
      const response = await api.get<{ data: Course[] }>("/course");
      return response.data.data;
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
    <div className="flex flex-col">
      {/* HERO */}
      <section className="bg-surface">
        <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-12 md:pt-24 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              Courses
            </p>
            <h1 className="text-4xl sm:text-[56px] font-bold text-navy tracking-tight leading-[1.05] mb-5">
              Learn something new
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md">
              Browse our collection of expert-led courses designed to help you
              build practical skills.
            </p>
          </motion.div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-[1200px] px-6 py-5">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-surface"
            />
          </div>
        </div>
      </section>

      {/* COURSE GRID */}
      <section className="py-10 md:py-16">
        <div className="mx-auto max-w-[1200px] px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredCourses && filteredCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeIn}
                >
                  <div className="h-full rounded-lg border border-border bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <Link href={`/courses/${course.id}`}>
                      <div className="aspect-[16/9] bg-surface flex items-center justify-center cursor-pointer">
                        <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    </Link>
                    <div className="p-5">
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
                        {course.topics.length > 3 && (
                          <span className="text-[11px] text-muted-foreground">
                            +{course.topics.length - 3} more
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {course.duration}h
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-foreground">
                          <DollarSign className="h-3.5 w-3.5" />
                          {course.price}
                        </div>
                      </div>
                      <Button
                        className="w-full h-9"
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link href={`/courses/${course.id}`}>
                          View course
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Filter className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
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
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-surface">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-lg"
          >
            <h2 className="text-2xl font-bold text-navy tracking-tight mb-2">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              We&apos;re always adding new courses. Let us know what you&apos;d
              like to learn next.
            </p>
            <Button asChild className="h-10 px-5">
              <Link href="/contact">
                Suggest a course
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
