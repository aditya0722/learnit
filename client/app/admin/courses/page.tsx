"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Loader2,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";
import { adminApi, type Course } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses", page, search],
    queryFn: () => adminApi.getCourses({ page, limit: 15, search: search || undefined }),
  });

  const { data: courseDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["admin-course-detail", selectedCourse],
    queryFn: () => adminApi.getCourse(selectedCourse!),
    enabled: selectedCourse !== null,
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setSelectedCourse(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-bold text-navy tracking-tight">Courses</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage courses and view performance metrics.
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
      >
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Course list */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-xl border border-border bg-white shadow-sm overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : data && data.courses.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Course</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Price</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Duration</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.courses.map((course) => (
                      <tr
                        key={course.id}
                        className={`hover:bg-surface/50 transition-colors cursor-pointer ${
                          selectedCourse === course.id ? "bg-primary/5" : ""
                        }`}
                        onClick={() => setSelectedCourse(course.id)}
                      >
                        <td className="px-5 py-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{course.name}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {course.topics.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] font-medium text-muted-foreground bg-surface px-1.5 py-0.5 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-medium text-foreground hidden sm:table-cell">
                          ${Number(course.price).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                          {course.duration}h
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourse(course.id);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.pagination.totalPages > 1 && (
                <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages} &middot;{" "}
                    {data.pagination.total} courses
                  </p>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No courses found.
            </div>
          )}
        </motion.div>

        {/* Course detail panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="sticky top-24"
        >
          {selectedCourse === null ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
              <Eye className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a course to view details
              </p>
            </div>
          ) : loadingDetail ? (
            <div className="rounded-xl border border-border bg-white p-8 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : courseDetail ? (
            <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-semibold text-navy truncate">{courseDetail.course.name}</h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  {courseDetail.course.topics.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="p-4 text-center">
                  <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold text-navy">{courseDetail.enrollments}</p>
                  <p className="text-[11px] text-muted-foreground">Enrolled</p>
                </div>
                <div className="p-4 text-center">
                  <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold text-navy">{courseDetail.chapters}</p>
                  <p className="text-[11px] text-muted-foreground">Chapters</p>
                </div>
                <div className="p-4 text-center">
                  <DollarSign className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-lg font-bold text-navy">
                    ${courseDetail.revenue.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Revenue</p>
                </div>
              </div>
              <div className="p-5 border-t border-border">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (confirm(`Delete course "${courseDetail.course.name}"? This cannot be undone.`)) {
                      deleteMutation.mutate(courseDetail.course.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Delete course
                </Button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
