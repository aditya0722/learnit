"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Plus,
  X,
  Sparkles,
  Lightbulb,
  Target,
  DollarSign,
  Clock,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { instructorCourseApi } from "@/lib/api";

const createCourseSchema = z.object({
  name: z.string().min(2, { message: "Course name must be at least 2 characters" }).max(255),
  topics: z.array(z.string().min(1)).min(1, { message: "Add at least one topic" }),
  duration: z.number({ message: "Duration must be a number" }).positive({ message: "Duration must be positive" }),
  price: z.number({ message: "Price must be a number" }).min(0, { message: "Price cannot be negative" }),
  thumbnail: z.string().min(1, { message: "Thumbnail URL is required" }),
});

type CreateCourseFormData = z.infer<typeof createCourseSchema>;

const tips = [
  { icon: Target, text: "Choose a clear, specific course name" },
  { icon: Lightbulb, text: "Add relevant topics to help students find your course" },
  { icon: DollarSign, text: "Research similar courses for competitive pricing" },
  { icon: Clock, text: "Accurately estimate total course duration" },
];

export default function CreateCoursePage() {
  const router = useRouter();
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      name: "",
      topics: [],
      duration: 0,
      price: 0,
      thumbnail: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCourseFormData) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("topics", JSON.stringify(data.topics));
      formData.append("duration", String(data.duration));
      formData.append("price", String(data.price));
      formData.append("thumbnail", data.thumbnail);
      return instructorCourseApi.createCourse(formData);
    },
    onSuccess: (result) => {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/instructor/courses`);
      }, 1500);
    },
  });

  const addTopic = () => {
    const trimmed = topicInput.trim();
    if (trimmed && !topics.includes(trimmed) && topics.length < 8) {
      const updated = [...topics, trimmed];
      setTopics(updated);
      form.setValue("topics", updated, { shouldValidate: true });
      setTopicInput("");
    }
  };

  const removeTopic = (topic: string) => {
    const updated = topics.filter((t) => t !== topic);
    setTopics(updated);
    form.setValue("topics", updated, { shouldValidate: true });
  };

  const onSubmit = (data: CreateCourseFormData) => {
    createMutation.mutate(data);
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-navy mb-2">Course created!</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Redirecting you to your courses...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href="/dashboard/instructor/courses">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            My Courses
          </Link>
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div className="space-y-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-blue-700 p-8 text-white"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCA0MGw0MC00ME0tMTAgNTBsNjAtNjBNMzAgNTBsNjAtNjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-40" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">Create a new course</h1>
              <p className="text-white/80 text-sm max-w-md">
                Share your knowledge with the world. Fill in the details below to get started.
              </p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-xl border border-border bg-white shadow-sm"
          >
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
              {createMutation.isError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {(createMutation.error as any)?.response?.data?.message ||
                    "Failed to create course. Please try again."}
                </div>
              )}

              {/* Course name */}
              <div>
                <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-4">
                  Course details
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Course name
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. Complete React Developer Masterclass"
                      {...form.register("name")}
                      className={form.formState.errors.name ? "border-destructive" : ""}
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  {/* Topics */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Topics</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a topic and press Add"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTopic();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addTopic} className="shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {topics.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {topics.map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium"
                          >
                            {topic}
                            <button
                              type="button"
                              onClick={() => removeTopic(topic)}
                              className="hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    {form.formState.errors.topics && (
                      <p className="text-xs text-destructive">{form.formState.errors.topics.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{topics.length}/8 topics</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Pricing & Duration */}
              <div>
                <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-4">
                  Pricing & duration
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      Price (USD)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="49.99"
                      {...form.register("price", { valueAsNumber: true })}
                      className={form.formState.errors.price ? "border-destructive" : ""}
                    />
                    {form.formState.errors.price && (
                      <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      Duration (hours)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      step="0.5"
                      placeholder="12.5"
                      {...form.register("duration", { valueAsNumber: true })}
                      className={form.formState.errors.duration ? "border-destructive" : ""}
                    />
                    {form.formState.errors.duration && (
                      <p className="text-xs text-destructive">{form.formState.errors.duration.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Thumbnail */}
              <div>
                <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-4">
                  Thumbnail
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="thumbnail" className="text-sm font-medium flex items-center gap-1.5">
                    <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
                    Image URL
                  </Label>
                  <Input
                    id="thumbnail"
                    placeholder="https://example.com/thumbnail.jpg"
                    {...form.register("thumbnail")}
                    className={form.formState.errors.thumbnail ? "border-destructive" : ""}
                  />
                  {form.formState.errors.thumbnail && (
                    <p className="text-xs text-destructive">{form.formState.errors.thumbnail.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Paste a URL for your course thumbnail image
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 flex items-center gap-3">
                <Button type="submit" className="h-10 px-6" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      Create course
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    form.reset();
                    setTopics([]);
                  }}
                >
                  Reset form
                </Button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Sidebar tips */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="hidden lg:block sticky top-24 space-y-4"
        >
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-navy mb-1">Tips for a great course</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Follow these guidelines to create an engaging course.
            </p>
            <div className="space-y-4">
              {tips.map((tip) => (
                <div key={tip.text} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <tip.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1.5">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-xs text-primary/80 leading-relaxed">
              <span className="font-semibold text-primary">Next step:</span>{" "}
              After creating your course, you can add chapters with video content from the course detail page.
            </p>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
