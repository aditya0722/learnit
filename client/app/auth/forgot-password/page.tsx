"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { authApi } from "@/lib/api";
import type { AxiosError } from "axios";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: authApi.resetPasswordRequest,
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message =
        error.response?.data?.message || error.message || "Something went wrong";
      form.setError("root", { message });
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-navy">Learnit</span>
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-navy mb-2">Check your email</h1>
            <p className="text-sm text-muted-foreground mb-6">
              If an account exists with that email, we&apos;ve sent a password reset link.
            </p>
            <Link href="/auth">
              <Button variant="outline" className="w-full h-10">
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-navy text-center mb-1">
              Forgot your password?
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Enter your email and we&apos;ll send you a reset link
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              {form.formState.errors.root && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {form.formState.errors.root.message}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...form.register("email")}
                  className={
                    form.formState.errors.email ? "border-destructive" : ""
                  }
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-10"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/auth"
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
