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
  Globe,
  Link2,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { adminApi, type AdminInstructor } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminInstructorsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-instructors", page, search],
    queryFn: () => adminApi.getInstructors({ page, limit: 15, search: search || undefined }),
  });

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["admin-instructor-detail", selected],
    queryFn: () => adminApi.getInstructor(selected!),
    enabled: selected !== null,
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteInstructor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-instructors"] });
      setSelected(null);
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
        <h1 className="text-2xl font-bold text-navy tracking-tight">Instructors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage instructor profiles.
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
              placeholder="Search instructors..."
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
        {/* Instructor list */}
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
          ) : data && data.instructors.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground">Instructor</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Expertise</th>
                      <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Experience</th>
                      <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.instructors.map((inst) => (
                      <tr
                        key={inst.id}
                        className={`hover:bg-surface/50 transition-colors cursor-pointer ${
                          selected === inst.id ? "bg-primary/5" : ""
                        }`}
                        onClick={() => setSelected(inst.id)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0">
                              {inst.userName.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">{inst.userName}</p>
                              <p className="text-xs text-muted-foreground truncate">{inst.headline || inst.userEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className="text-xs font-medium bg-primary/8 text-primary px-2 py-0.5 rounded">
                            {inst.expertise || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs hidden md:table-cell">
                          {inst.experienceYears ?? 0} years
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(inst.id);
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
                    {data.pagination.total} instructors
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
              No instructors found.
            </div>
          )}
        </motion.div>

        {/* Detail panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="sticky top-24"
        >
          {selected === null ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-8 text-center">
              <Eye className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Select an instructor to view details
              </p>
            </div>
          ) : loadingDetail ? (
            <div className="rounded-xl border border-border bg-white p-8 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : detail ? (
            <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                    {detail.userName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">{detail.userName}</h3>
                    <p className="text-xs text-muted-foreground">{detail.userEmail}</p>
                  </div>
                </div>
                {detail.headline && (
                  <p className="text-sm text-foreground font-medium">{detail.headline}</p>
                )}
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-surface">
                    <p className="text-lg font-bold text-navy">{detail.experienceYears ?? 0}</p>
                    <p className="text-[11px] text-muted-foreground">Years experience</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface">
                    <p className="text-lg font-bold text-navy">{detail.courseCount}</p>
                    <p className="text-[11px] text-muted-foreground">Courses</p>
                  </div>
                </div>

                {detail.expertise && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Expertise</p>
                    <p className="text-sm text-foreground">{detail.expertise}</p>
                  </div>
                )}

                {detail.bio && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Bio</p>
                    <p className="text-sm text-foreground leading-relaxed">{detail.bio}</p>
                  </div>
                )}

                {/* Social links */}
                <div className="space-y-2">
                  {detail.website && (
                    <a
                      href={detail.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {detail.linkedin && (
                    <a
                      href={detail.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {detail.github && (
                    <a
                      href={detail.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="p-5 border-t border-border">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (confirm(`Remove instructor "${detail.userName}"? Their instructor profile will be deleted.`)) {
                      deleteMutation.mutate(detail.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Remove instructor
                </Button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
