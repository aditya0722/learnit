"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from "@/lib/validations/auth";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AxiosError } from "axios";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [successMessage, setSuccessMessage] = useState("");
  const { login: authLogin, register: authRegister } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      age: 0,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return await authLogin(data.email, data.password);
    },
    onSuccess: (userData) => {
      window.location.href = userData?.role === "admin" ? "/admin" : "/dashboard";
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message =
        error.response?.data?.message || error.message || "Login failed";
      loginForm.setError("root", { message });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...payload } = data;
      await authRegister(payload);
    },
    onSuccess: () => {
      window.location.href = "/dashboard";
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Registration failed";
      registerForm.setError("root", { message });
    },
  });

  const onLoginSubmit = (data: LoginFormData) => {
    setSuccessMessage("");
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormData) => {
    setSuccessMessage("");
    registerMutation.mutate(data);
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

        <h1 className="text-xl font-bold text-navy text-center mb-1">
          {activeTab === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {activeTab === "login"
            ? "Sign in to your account"
            : "Get started with Learnit"}
        </p>

        <div className="flex rounded-lg border border-border bg-surface p-0.5 mb-6">
          {(["login", "register"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSuccessMessage("");
              }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? "bg-white text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            {successMessage}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === "login" && (
            <motion.div
              key="login"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-3"
              >
                {loginForm.formState.errors.root && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {loginForm.formState.errors.root.message}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-sm">
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    {...loginForm.register("email")}
                    className={
                      loginForm.formState.errors.email
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-sm">
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                    className={
                      loginForm.formState.errors.password
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {activeTab === "register" && (
            <motion.div
              key="register"
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-3"
              >
                {registerForm.formState.errors.root && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {registerForm.formState.errors.root.message}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="register-name" className="text-sm">
                    Full name
                  </Label>
                  <Input
                    id="register-name"
                    placeholder="Your name"
                    {...registerForm.register("name")}
                    className={
                      registerForm.formState.errors.name
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-email" className="text-sm">
                    Email
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="you@example.com"
                    {...registerForm.register("email")}
                    className={
                      registerForm.formState.errors.email
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-age" className="text-sm">
                    Age
                  </Label>
                  <Input
                    id="register-age"
                    type="number"
                    placeholder="25"
                    {...registerForm.register("age", {
                      valueAsNumber: true,
                    })}
                    className={
                      registerForm.formState.errors.age
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {registerForm.formState.errors.age && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.age.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-password" className="text-sm">
                    Password
                  </Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register("password")}
                    className={
                      registerForm.formState.errors.password
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="register-confirm" className="text-sm">
                    Confirm password
                  </Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register("confirmPassword")}
                    className={
                      registerForm.formState.errors.confirmPassword
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {
                        registerForm.formState.errors.confirmPassword
                          .message
                      }
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <Separator className="my-6" />

        <p className="text-center text-xs text-muted-foreground">
          {activeTab === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  setActiveTab("register");
                  setSuccessMessage("");
                }}
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setActiveTab("login");
                  setSuccessMessage("");
                }}
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
