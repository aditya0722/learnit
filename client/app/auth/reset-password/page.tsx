"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations/auth";
import { authApi } from "@/lib/api";
import type { AxiosError } from "axios";

function ResetPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      if (!token) throw new Error("No reset token found");
      await authApi.resetPasswordConfirm({
        token,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message =
        error.response?.data?.message || error.message || "Something went wrong";
      form.setError("root", { message });
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    mutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold text-navy mb-2">Invalid reset link</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/auth/forgot-password">
          <Button className="w-full h-10">Request a new link</Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-navy mb-2">Password reset!</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Your password has been reset successfully.
        </p>
        <Link href="/auth">
          <Button className="w-full h-10">Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold text-navy text-center mb-1">
        Set new password
      </h1>
      <p className="text-sm text-muted-foreground text-center mb-8">
        Enter your new password below
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {form.formState.errors.root && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-sm">
            New password
          </Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            {...form.register("newPassword")}
            className={
              form.formState.errors.newPassword ? "border-destructive" : ""
            }
          />
          {form.formState.errors.newPassword && (
            <p className="text-xs text-destructive">
              {form.formState.errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm">
            Confirm new password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...form.register("confirmPassword")}
            className={
              form.formState.errors.confirmPassword ? "border-destructive" : ""
            }
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {form.formState.errors.confirmPassword.message}
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
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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

        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
