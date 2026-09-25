"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { instructorCourseApi, discountApi, type InstructorCourseDetail, type Discount } from "@/lib/api";
import { useSnackbar } from "@/components/snackbar-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  Users,
  DollarSign,
  BookOpen,
  Clock,
  PlayCircle,
  BarChart3,
  TrendingUp,
  Calendar,
  Layers,
  Pencil,
  X,
  Check,
  Tag,
  Ticket,
  Copy,
  Trash2,
  RefreshCw,
} from "lucide-react";

const editCourseSchema = z.object({
  name: z.string().min(2, { message: "Course name must be at least 2 characters" }).max(255),
  topics: z.array(z.string().min(1)).min(1, { message: "Add at least one topic" }),
  duration: z.number({ message: "Duration must be a number" }).positive({ message: "Duration must be positive" }),
  price: z.number({ message: "Price must be a number" }).min(0, { message: "Price cannot be negative" }),
  thumbnail: z.string().min(1, { message: "Thumbnail URL is required" }),
});

type EditCourseFormData = z.infer<typeof editCourseSchema>;

const discountSchema = z.object({
  discount: z.number().min(0).max(100, { message: "Discount must be between 0 and 100" }),
  couponCode: z.string().min(3).max(50).optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
  maxUses: z.number().int().positive().optional().or(z.literal(0)),
});

type DiscountFormData = z.infer<typeof discountSchema>;

function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "LEARN-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function InstructorCourseDetailPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const queryClient = useQueryClient();
  const { toast } = useSnackbar();

  const [editingCourse, setEditingCourse] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);

  const { data: course, isLoading } = useQuery({
    queryKey: ["instructor", "course", courseId],
    queryFn: () => instructorCourseApi.getMyCourseDetail(courseId),
    enabled: !!courseId,
  });

  const { data: discount } = useQuery({
    queryKey: ["discount", courseId],
    queryFn: () => discountApi.getByCourse(courseId),
    enabled: !!courseId,
  });

  const courseForm = useForm<EditCourseFormData>({
    resolver: zodResolver(editCourseSchema),
    defaultValues: {
      name: "",
      topics: [],
      duration: 0,
      price: 0,
      thumbnail: "",
    },
  });

  const discountForm = useForm<DiscountFormData>({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      discount: 0,
      couponCode: "",
      expiresAt: "",
      maxUses: 0,
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: (data: EditCourseFormData) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("topics", JSON.stringify(data.topics));
      formData.append("duration", String(data.duration));
      formData.append("price", String(data.price));
      formData.append("thumbnail", data.thumbnail);
      return instructorCourseApi.updateCourse(courseId, formData);
    },
    onSuccess: () => {
      toast("Course updated successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ["instructor", "course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["instructor", "courses"] });
      setEditingCourse(false);
    },
    onError: () => {
      toast("Failed to update course. Please try again.", "error");
    },
  });

  const createDiscountMutation = useMutation({
    mutationFn: (data: DiscountFormData) => {
      return discountApi.create({
        courseId,
        discount: data.discount,
        couponCode: data.couponCode || undefined,
        expiresAt: data.expiresAt || undefined,
        maxUses: data.maxUses || undefined,
      });
    },
    onSuccess: () => {
      toast("Discount created successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ["discount", courseId] });
      setShowDiscountForm(false);
      discountForm.reset();
    },
    onError: () => {
      toast("Failed to create discount.", "error");
    },
  });

  const updateDiscountMutation = useMutation({
    mutationFn: (data: DiscountFormData) => {
      if (!discount) return Promise.reject("No discount");
      return discountApi.update(discount.id, {
        discount: data.discount,
        couponCode: data.couponCode || null,
        expiresAt: data.expiresAt || null,
        maxUses: data.maxUses || null,
      });
    },
    onSuccess: () => {
      toast("Discount updated successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ["discount", courseId] });
      setEditingDiscount(false);
    },
    onError: () => {
      toast("Failed to update discount.", "error");
    },
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: () => {
      if (!discount) return Promise.reject("No discount");
      return discountApi.delete(discount.id);
    },
    onSuccess: () => {
      toast("Discount removed.", "info");
      queryClient.invalidateQueries({ queryKey: ["discount", courseId] });
      setEditingDiscount(false);
    },
    onError: () => {
      toast("Failed to delete discount.", "error");
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: () => instructorCourseApi.deleteCourse(courseId),
    onSuccess: () => {
      toast("Course deleted.", "info");
      queryClient.invalidateQueries({ queryKey: ["instructor", "courses"] });
      window.location.href = "/dashboard/instructor/courses";
    },
    onError: () => {
      toast("Failed to delete course.", "error");
    },
  });

  const startEditCourse = () => {
    if (!course) return;
    setTopics(course.topics);
    courseForm.reset({
      name: course.name,
      topics: course.topics,
      duration: Number(course.duration),
      price: Number(course.price),
      thumbnail: course.thumbnail,
    });
    setEditingCourse(true);
  };

  const startEditDiscount = () => {
    if (discount) {
      discountForm.reset({
        discount: Number(discount.discount),
        couponCode: discount.couponCode || "",
        expiresAt: discount.expiresAt ? new Date(discount.expiresAt).toISOString().slice(0, 16) : "",
        maxUses: discount.maxUses || 0,
      });
    }
    setEditingDiscount(true);
  };

  const addTopic = () => {
    const trimmed = topicInput.trim();
    if (trimmed && !topics.includes(trimmed) && topics.length < 8) {
      const updated = [...topics, trimmed];
      setTopics(updated);
      courseForm.setValue("topics", updated, { shouldValidate: true });
      setTopicInput("");
    }
  };

  const removeTopic = (topic: string) => {
    const updated = topics.filter((t) => t !== topic);
    setTopics(updated);
    courseForm.setValue("topics", updated, { shouldValidate: true });
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast("Coupon code copied!", "success");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Course not found.</p>
        <Link href="/dashboard/instructor/courses">
          <Button variant="link" className="mt-2">Go back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <Link href="/dashboard/instructor/courses">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy tracking-tight">{course.name}</h1>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {course.topics.map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={startEditCourse}>
          <Pencil className="h-3.5 w-3.5" />
          Edit Course
        </Button>
        <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5">
          <Link href={`/dashboard/instructor/courses/${courseId}/chapters`}>
            <Layers className="h-3.5 w-3.5" />
            Manage Chapters
          </Link>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => {
            if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
              deleteCourseMutation.mutate();
            }
          }}
          disabled={deleteCourseMutation.isPending}
        >
          {deleteCourseMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </Button>
      </motion.div>

      {/* Edit Course Form */}
      <AnimatePresence>
        {editingCourse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-primary" />
                  Edit Course Details
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingCourse(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={courseForm.handleSubmit((data) => updateCourseMutation.mutate(data))} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium">Course name</Label>
                    <Input id="name" {...courseForm.register("name")} />
                    {courseForm.formState.errors.name && (
                      <p className="text-xs text-destructive">{courseForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Topics</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a topic and press Add"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(); } }}
                      />
                      <Button type="button" variant="outline" onClick={addTopic} className="shrink-0">
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                    {topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {topics.map((topic) => (
                          <span key={topic} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium">
                            {topic}
                            <button type="button" onClick={() => removeTopic(topic)} className="hover:text-destructive transition-colors">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="price" className="text-sm font-medium flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Price (USD)
                      </Label>
                      <Input id="price" type="number" step="0.01" {...courseForm.register("price", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Duration (hours)
                      </Label>
                      <Input id="duration" type="number" step="0.5" {...courseForm.register("duration", { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="thumbnail" className="text-sm font-medium flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" /> Thumbnail URL
                    </Label>
                    <Input id="thumbnail" {...courseForm.register("thumbnail")} />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button type="submit" size="sm" disabled={updateCourseMutation.isPending}>
                      {updateCourseMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                      Save Changes
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCourse(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats cards */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <div className="p-4 rounded-xl border border-border bg-white shadow-sm min-h-[120px]">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5">
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-navy">{course.enrollmentCount}</p>
          <p className="text-xs text-muted-foreground">Students enrolled</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-white shadow-sm min-h-[120px]">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-2.5">
            <DollarSign className="h-4.5 w-4.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-navy">${course.revenue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total revenue</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-white shadow-sm min-h-[120px]">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center mb-2.5">
            <Layers className="h-4.5 w-4.5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-navy">{course.chaptersCount}</p>
          <p className="text-xs text-muted-foreground">Chapters</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-white shadow-sm min-h-[120px]">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2.5">
            <Clock className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-navy">{course.duration}h</p>
          <p className="text-xs text-muted-foreground">Duration</p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-[3fr_2fr] gap-6">
        {/* Course info */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Course Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                  <p className="text-sm font-semibold text-navy">${Number(course.price).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Revenue per student</p>
                  <p className="text-sm font-semibold text-navy">
                    ${course.enrollmentCount > 0
                      ? (course.revenue / course.enrollmentCount).toFixed(2)
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                  <p className="text-sm font-medium">
                    {new Date(course.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Last updated</p>
                  <p className="text-sm font-medium">
                    {new Date(course.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-2">Performance</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Conversion rate
                    </span>
                    <span className="font-medium">
                      {course.enrollmentCount > 0 ? `${course.enrollmentCount} sales` : "No sales yet"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Chapters added
                    </span>
                    <span className="font-medium">{course.chaptersCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chapters preview */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Chapters
              </CardTitle>
              <Link href={`/dashboard/instructor/courses/${courseId}/chapters`}>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  View all
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {course.chapters.length > 0 ? (
                <div className="space-y-2">
                  {course.chapters.slice(0, 5).map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface/50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <PlayCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{chapter.chapterName}</p>
                        <p className="text-xs text-muted-foreground">
                          Chapter {chapter.chapterNumber}
                        </p>
                      </div>
                    </div>
                  ))}
                  {course.chapters.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{course.chapters.length - 5} more chapters
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No chapters yet</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/instructor/courses/${courseId}/chapters`}>
                      Add first chapter
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Discount & Pricing Section */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Discount & Pricing
            </CardTitle>
            {!discount && !showDiscountForm && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setShowDiscountForm(true); discountForm.reset({ discount: 0, couponCode: "", expiresAt: "", maxUses: 0 }); }}>
                <Tag className="h-3.5 w-3.5" />
                Add Discount
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {discount && !editingDiscount ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-surface/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Discount</p>
                    <p className="text-lg font-bold text-primary">{Number(discount.discount)}% off</p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Final Price</p>
                    <p className="text-lg font-bold text-navy">
                      ${(Number(course.price) * (1 - Number(discount.discount) / 100)).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Uses</p>
                    <p className="text-lg font-bold text-navy">
                      {discount.usedCount}{discount.maxUses ? ` / ${discount.maxUses}` : ""}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-surface/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Expires</p>
                    <p className="text-sm font-medium text-navy">
                      {discount.expiresAt
                        ? new Date(discount.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "Never"}
                    </p>
                  </div>
                </div>

                {discount.couponCode && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Ticket className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Coupon Code</p>
                      <p className="text-sm font-mono font-bold text-navy">{discount.couponCode}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyCouponCode(discount.couponCode!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={startEditDiscount}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteDiscountMutation.mutate()} disabled={deleteDiscountMutation.isPending}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : editingDiscount ? (
              <form onSubmit={discountForm.handleSubmit((data) => updateDiscountMutation.mutate(data))} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Discount %</Label>
                    <Input type="number" min="0" max="100" {...discountForm.register("discount", { valueAsNumber: true })} />
                    {discountForm.formState.errors.discount && (
                      <p className="text-xs text-destructive">{discountForm.formState.errors.discount.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
                      Coupon Code
                    </Label>
                    <div className="flex gap-2">
                      <Input placeholder="LEARN-XXXX" {...discountForm.register("couponCode")} />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-9 w-9"
                        onClick={() => discountForm.setValue("couponCode", generateCouponCode())}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Expires At</Label>
                    <Input type="datetime-local" {...discountForm.register("expiresAt")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Max Uses</Label>
                    <Input type="number" min="0" placeholder="Unlimited" {...discountForm.register("maxUses", { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={updateDiscountMutation.isPending}>
                    {updateDiscountMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                    Save Discount
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingDiscount(false)}>Cancel</Button>
                </div>
              </form>
            ) : showDiscountForm ? (
              <form onSubmit={discountForm.handleSubmit((data) => createDiscountMutation.mutate(data))} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Discount %</Label>
                    <Input type="number" min="0" max="100" placeholder="10" {...discountForm.register("discount", { valueAsNumber: true })} />
                    {discountForm.formState.errors.discount && (
                      <p className="text-xs text-destructive">{discountForm.formState.errors.discount.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
                      Coupon Code
                    </Label>
                    <div className="flex gap-2">
                      <Input placeholder="LEARN-XXXX" {...discountForm.register("couponCode")} />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-9 w-9"
                        onClick={() => discountForm.setValue("couponCode", generateCouponCode())}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Leave empty to auto-generate</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Expires At</Label>
                    <Input type="datetime-local" {...discountForm.register("expiresAt")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Max Uses</Label>
                    <Input type="number" min="0" placeholder="Unlimited" {...discountForm.register("maxUses", { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={createDiscountMutation.isPending}>
                    {createDiscountMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Tag className="mr-1 h-3.5 w-3.5" />}
                    Create Discount
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowDiscountForm(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <Tag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No discount set for this course</p>
                <Button size="sm" variant="outline" onClick={() => { setShowDiscountForm(true); discountForm.reset({ discount: 0, couponCode: "", expiresAt: "", maxUses: 0 }); }}>
                  <Tag className="mr-1.5 h-3.5 w-3.5" />
                  Add Discount
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
