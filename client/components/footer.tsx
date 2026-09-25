import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Product: [
    { href: "/courses", label: "Courses" },
    { href: "/courses", label: "Pricing" },
    { href: "/courses", label: "For Teams" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "/about", label: "Careers" },
  ],
  Resources: [
    { href: "/contact", label: "Help Center" },
    { href: "/contact", label: "Blog" },
    { href: "/contact", label: "Community" },
  ],
  Legal: [
    { href: "#", label: "Privacy" },
    { href: "#", label: "Terms" },
    { href: "#", label: "Cookie Policy" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight text-navy">
                Learnit
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Practical education for ambitious people. Learn real skills from
              experienced instructors.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Learnit. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Twitter", "GitHub", "LinkedIn"].map((platform) => (
              <Link
                key={platform}
                href="#"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {platform}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
