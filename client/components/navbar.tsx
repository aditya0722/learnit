"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Menu, LogOut, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-navy">
            Learnit
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-md"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={user?.role === "admin" ? "/admin" : "/dashboard"}>
                      {user?.role === "admin" ? (
                        <Shield className="mr-1.5 h-3.5 w-3.5" />
                      ) : (
                        <User className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {user?.role === "admin" ? "Admin Panel" : user?.name}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                  >
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth">Log in</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/auth">Get Started</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="flex items-center gap-2 text-sm">
                <div className="flex items-center justify-center w-6 h-6 rounded bg-primary">
                  <BookOpen className="w-3 h-3 text-white" />
                </div>
                Learnit
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col p-4 gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted rounded-md"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 p-4 border-t border-border">
              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <>
                      {user?.role === "admin" && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/admin" onClick={() => setOpen(false)}>
                            <Shield className="mr-1.5 h-3.5 w-3.5" />
                            Admin Panel
                          </Link>
                        </Button>
                      )}
                      <Button size="sm" asChild>
                        <Link href={user?.role === "admin" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)}>
                          {user?.role === "admin" ? "Admin Panel" : "Dashboard"}
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          logout();
                          setOpen(false);
                        }}
                      >
                        Log out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/auth" onClick={() => setOpen(false)}>
                          Log in
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href="/auth" onClick={() => setOpen(false)}>
                          Get Started
                        </Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
