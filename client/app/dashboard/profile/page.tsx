"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Loader2,
  Save,
  CheckCircle2,
  User,
  Mail,
  Calendar,
  Shield,
  BookOpen,
  Clock,
  Camera,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";
import { userApi, courseTakenApi, courseApi } from "@/lib/api";
import Link from "next/link";

const profileSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(255),
  email: z.string().email({ message: "Please enter a valid email" }),
  age: z
    .number({ message: "Age must be a number" })
    .int()
    .min(13, { message: "You must be at least 13 years old" })
    .max(120),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useUser();
  const [success, setSuccess] = useState(false);

  const { data: enrollments } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: () => courseTakenApi.getByUser(user!.id),
    enabled: !!user,
  });

  const { data: allCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: courseApi.getAll,
  });

  const enrolledCourses =
    enrollments
      ?.map((e) => allCourses?.find((c) => c.id === e.courseId))
      .filter(Boolean) || [];

  const totalHours = enrolledCourses.reduce(
    (sum, c) => sum + Number(c?.duration || 0),
    0
  );

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      age: user?.age || 0,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => userApi.update(user!.id, data),
    onSuccess: () => {
      setUser(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    setSuccess(false);
    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and preferences.
        </p>
      </motion.div>

      {/* Profile header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="rounded-lg border border-border bg-white shadow-sm overflow-hidden"
      >
        {/* Cover */}
        <div className="h-28 bg-gradient-to-r from-primary/8 via-primary/5 to-primary/10 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(37,99,235,0.1),transparent_60%)]" />
        </div>

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-navy text-white text-xl font-bold flex items-center justify-center border-4 border-white shadow-sm">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "?"}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex-1 sm:pb-1">
              <h2 className="text-lg font-bold text-navy">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" asChild className="sm:self-center">
              <Link href="/dashboard/courses">
                My courses
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="p-4 rounded-lg border border-border bg-white shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-navy">{enrolledCourses.length}</p>
          <p className="text-xs text-muted-foreground">Courses enrolled</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-white shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-navy">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">Total hours</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-white shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-navy">
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Member since</p>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Edit form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.14 }}
          className="rounded-lg border border-border bg-white shadow-sm"
        >
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-sm font-semibold text-navy">Personal information</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Update your name, email, and age.
            </p>
          </div>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="p-6 space-y-5"
          >
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Profile updated successfully.
              </div>
            )}

            {updateMutation.isError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                Failed to update profile. Please try again.
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Full name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Your name"
                  {...form.register("name")}
                  className={`pl-9 ${form.formState.errors.name ? "border-destructive" : ""}`}
                />
              </div>
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...form.register("email")}
                  className={`pl-9 ${form.formState.errors.email ? "border-destructive" : ""}`}
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="age" className="text-sm font-medium">
                Age
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  {...form.register("age", { valueAsNumber: true })}
                  className={`pl-9 ${form.formState.errors.age ? "border-destructive" : ""}`}
                />
              </div>
              {form.formState.errors.age && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.age.message}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="submit"
                className="h-10 px-5"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => form.reset()}
              >
                Reset
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Sidebar: account info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.18 }}
          className="space-y-4 lg:sticky lg:top-20"
        >
          {/* Account details */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-navy">Account</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Account ID</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    #{user?.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Email</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Joined</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enrolled courses quick list */}
          {enrolledCourses.length > 0 && (
            <div className="rounded-lg border border-border bg-white shadow-sm">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">
                  Your courses
                </h3>
                <span className="text-xs text-muted-foreground">
                  {enrolledCourses.length}
                </span>
              </div>
              <div className="p-3">
                {enrolledCourses.slice(0, 4).map((course) => (
                  <Link
                    key={course!.id}
                    href={`/dashboard/courses/${course!.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">
                        {course!.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {course!.duration}h
                      </p>
                    </div>
                  </Link>
                ))}
                {enrolledCourses.length > 4 && (
                  <Link
                    href="/dashboard/courses"
                    className="flex items-center justify-center px-3 py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    View all {enrolledCourses.length} courses
                  </Link>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
