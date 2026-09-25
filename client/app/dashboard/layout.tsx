"use client";

import { useAuth } from "@/lib/auth-context";
import WorkspaceSidebar from "@/components/workspace-sidebar";
import WorkspaceHeader from "@/components/workspace-header";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/auth");
      } else if (user?.role === "admin") {
        router.replace("/admin");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role === "admin") return null;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-surface">
      <div className="lg:hidden flex items-center h-12 px-4 border-b border-border bg-white">
        <WorkspaceHeader />
      </div>
      <div className="flex">
        <WorkspaceSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
