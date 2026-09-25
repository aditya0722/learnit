"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  ArrowLeft,
  GraduationCap,
  Globe,
  Link2,
  ExternalLink,
  Users,
  Award,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/hooks/use-user";
import { instructorApi } from "@/lib/api";
import Link from "next/link";

const applySchema = z.object({
  bio: z
    .string()
    .min(10, { message: "Bio must be at least 10 characters" })
    .max(1000),
  headline: z
    .string()
    .min(2, { message: "Headline must be at least 2 characters" })
    .max(255),
  expertise: z
    .string()
    .min(2, { message: "Expertise must be at least 2 characters" })
    .max(255),
  experienceYears: z
    .number({ message: "Experience must be a number" })
    .int()
    .min(0, { message: "Experience must be at least 0 years" })
    .max(50),
  website: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
  linkedin: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
  github: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
});

type ApplyFormData = z.infer<typeof applySchema>;

const benefits = [
  {
    icon: Users,
    title: "Reach thousands",
    description: "Access a global audience of eager learners.",
  },
  {
    icon: TrendingUp,
    title: "Earn income",
    description: "Monetize your knowledge with every enrollment.",
  },
  {
    icon: Award,
    title: "Build reputation",
    description: "Establish yourself as a trusted industry expert.",
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

export default function ApplyInstructorPage() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const form = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      bio: "",
      headline: "",
      expertise: "",
      experienceYears: 0,
      website: "",
      linkedin: "",
      github: "",
    },
  });

  const applyMutation = useMutation({
    mutationFn: (data: ApplyFormData) => instructorApi.apply(user!.id, data),
    onSuccess: () => {
      setUser(null);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    },
  });

  const onSubmit = (data: ApplyFormData) => {
    applyMutation.mutate(data);
  };

  if (user?.role === "instructor") {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-navy mb-2">
          You&apos;re already an instructor
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          You can start creating courses from your dashboard.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-navy mb-2">
            Welcome to the instructor team!
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your application has been accepted. Redirecting to dashboard...
          </p>
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href="/dashboard">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Dashboard
          </Link>
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Left — Form */}
        <div className="space-y-6">
          {/* Hero header */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-blue-700 p-8 text-white"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCA0MGw0MC00ME0tMTAgNTBsNjAtNjBNMzAgNTBsNjAtNjAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-40" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">
                Become an instructor
              </h1>
              <p className="text-white/80 text-sm max-w-md">
                Share your expertise, inspire learners, and earn while you teach.
                Fill out your profile to get started.
              </p>
            </div>
          </motion.div>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="rounded-xl border border-border bg-white shadow-sm"
          >
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="p-6 space-y-6"
            >
              {applyMutation.isError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {(applyMutation.error as any)?.response?.data?.message ||
                    "Failed to submit application. Please try again."}
                </div>
              )}

              {/* Professional info */}
              <div>
                <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-4">
                  Professional details
                </p>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="headline" className="text-sm font-medium">
                      Headline
                    </Label>
                    <Input
                      id="headline"
                      placeholder="e.g. Senior Software Engineer at Google"
                      {...form.register("headline")}
                      className={
                        form.formState.errors.headline
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {form.formState.errors.headline && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.headline.message}
                      </p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="expertise"
                        className="text-sm font-medium"
                      >
                        Area of expertise
                      </Label>
                      <Input
                        id="expertise"
                        placeholder="e.g. React, Node.js"
                        {...form.register("expertise")}
                        className={
                          form.formState.errors.expertise
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.expertise && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.expertise.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="experienceYears"
                        className="text-sm font-medium"
                      >
                        Years of experience
                      </Label>
                      <Input
                        id="experienceYears"
                        type="number"
                        placeholder="5"
                        {...form.register("experienceYears", {
                          valueAsNumber: true,
                        })}
                        className={
                          form.formState.errors.experienceYears
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.experienceYears && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.experienceYears.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Bio */}
              <div>
                <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-4">
                  About you
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-sm font-medium">
                    Bio
                  </Label>
                  <textarea
                    id="bio"
                    rows={5}
                    placeholder="Tell learners about your background, teaching style, and what they'll learn from you..."
                    {...form.register("bio")}
                    className={`flex w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none leading-relaxed ${
                      form.formState.errors.bio
                        ? "border-destructive"
                        : "border-input"
                    }`}
                  />
                  <div className="flex justify-between">
                    {form.formState.errors.bio ? (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.bio.message}
                      </p>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-muted-foreground">
                      {form.watch("bio")?.length || 0}/1000
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Social links */}
              <div>
                <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-4">
                  Social links{" "}
                  <span className="text-muted-foreground font-normal normal-case">
                    (optional)
                  </span>
                </p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="website"
                      className="text-sm font-medium flex items-center gap-1.5"
                    >
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      placeholder="https://yoursite.com"
                      {...form.register("website")}
                      className={
                        form.formState.errors.website
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {form.formState.errors.website && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.website.message}
                      </p>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="linkedin"
                        className="text-sm font-medium flex items-center gap-1.5"
                      >
                        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/you"
                        {...form.register("linkedin")}
                        className={
                          form.formState.errors.linkedin
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.linkedin && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.linkedin.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="github"
                        className="text-sm font-medium flex items-center gap-1.5"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        GitHub
                      </Label>
                      <Input
                        id="github"
                        placeholder="https://github.com/you"
                        {...form.register("github")}
                        className={
                          form.formState.errors.github
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.github && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.github.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="submit"
                  className="h-10 px-6"
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="mr-1.5 h-4 w-4" />
                      Submit application
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => form.reset()}
                >
                  Reset form
                </Button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Right — Benefits sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="hidden lg:block sticky top-24 space-y-4"
        >
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-navy mb-1">
              Why teach on Learnit?
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              Join a community of instructors changing lives through education.
            </p>
            <div className="space-y-4">
              {benefits.map((b) => (
                <div key={b.title} className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <b.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {b.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-xs text-primary/80 leading-relaxed">
              <span className="font-semibold text-primary">
                Have questions?
              </span>{" "}
              Reach out to our instructor support team at{" "}
              <span className="font-medium text-primary">
                instructors@learnit.com
              </span>
            </p>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
