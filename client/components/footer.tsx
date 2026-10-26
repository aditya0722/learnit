import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col justify-between gap-6 py-9 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="mb-2 inline-flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <BookOpen className="size-3.5" />
              </span>
              Learnit
            </Link>
            <p className="text-sm text-muted-foreground">
              Small steps. Practical skills. Your pace.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground"
          >
            {[
              { href: "/courses", label: "Courses" },
              { href: "/system-design/playground", label: "Playground" },
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <Separator />
        <p className="py-5 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Learnit. Keep learning.
        </p>
      </div>
    </footer>
  );
}
