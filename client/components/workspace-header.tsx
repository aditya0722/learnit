"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Menu,
  LayoutDashboard,
  Compass,
  User,
  LogOut,
  GraduationCap,
  Plus,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUser } from "@/hooks/use-user";

const learnerLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/browse", label: "Browse", icon: Compass },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const instructorLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "My Courses", icon: BookOpen },
  { href: "/dashboard/browse", label: "Browse", icon: Compass },
  { href: "/dashboard/instructor/courses", label: "My Teaching", icon: GraduationCap },
  { href: "/dashboard/instructor/create", label: "Create Course", icon: Plus },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const applyLink = { href: "/dashboard/instructor/apply", label: "Become Instructor", icon: GraduationCap };

export default function WorkspaceHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useUser();

  const isAdmin = user?.role === "admin";
  const isInstructor = user?.role === "instructor";
  const links = isAdmin ? [] : isInstructor ? instructorLinks : learnerLinks;

  return (
    <div className="lg:hidden flex items-center gap-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="lg:hidden"
          render={
            <Button variant="ghost" size="icon" className="h-8 w-8" />
          }
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-primary">
                <BookOpen className="w-3 h-3 text-white" />
              </div>
              Learnit
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col p-4 gap-0.5">
            {links.map((link) => {
              const isActive =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
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
            {!isInstructor && !isAdmin && (
              <>
                <div className="my-2 border-t border-border" />
                <Link
                  href={applyLink.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  <applyLink.icon className="h-4 w-4" />
                  {applyLink.label}
                </Link>
              </>
            )}
            {isAdmin && (
              <>
                <div className="my-2 border-t border-border" />
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Admin Panel
                </Link>
              </>
            )}
          </nav>
          <div className="p-4 border-t border-border">
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
          <BookOpen className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-base font-semibold tracking-tight text-navy">
          Learnit
        </span>
      </Link>
    </div>
  );
}
