"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  User,
  LogOut,
  GraduationCap,
  Plus,
  Shield,
  Code2,
} from "lucide-react";
import { useUser } from "@/hooks/use-user";

const learnerLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/playground", label: "Playground", icon: Code2 },
  { href: "/dashboard/browse", label: "Browse", icon: Compass },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const instructorLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/playground", label: "Playground", icon: Code2 },
  { href: "/dashboard/browse", label: "Browse", icon: Compass },
  { href: "/dashboard/instructor/courses", label: "My Teaching", icon: GraduationCap },
  { href: "/dashboard/instructor/create", label: "Create Course", icon: Plus },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const applyLink = { href: "/dashboard/instructor/apply", label: "Become Instructor", icon: GraduationCap };

export default function WorkspaceSidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();

  const isAdmin = user?.role === "admin";
  const isInstructor = user?.role === "instructor";
  const links = isAdmin ? [] : isInstructor ? instructorLinks : learnerLinks;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:border-r border-border bg-white shrink-0">
      {/* User info */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-navy text-white text-xs font-semibold flex items-center justify-center">
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("") || "?"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.name}
              </p>
              {isInstructor && (
                <span className="text-[10px] font-semibold text-primary bg-primary/8 px-1.5 py-0.5 rounded">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((link) => {
          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}

        {/* Apply to become instructor */}
        {!isInstructor && !isAdmin && (
          <>
            <div className="my-2 border-t border-border" />
            <Link
              href={applyLink.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <applyLink.icon className="h-4 w-4" />
              {applyLink.label}
            </Link>
          </>
        )}

        {/* Admin link */}
        {isAdmin && (
          <>
            <div className="my-2 border-t border-border" />
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
