"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Layers3,
  Terminal,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const paths = [
  {
    icon: Code2,
    title: "Build for the web",
    description:
      "Turn ideas into interfaces. Explore frontend tools, frameworks, and the foundations behind them.",
    href: "/courses",
    label: "Explore courses",
    color: "bg-blue-50 text-blue-700",
  },
  {
    icon: Workflow,
    title: "Think in systems",
    description:
      "Explore how services connect. Design architectures and see how your decisions play out.",
    href: "/system-design/playground",
    label: "Open the playground",
    color: "bg-amber-50 text-amber-700",
  },
  {
    icon: Terminal,
    title: "Put it into practice",
    description:
      "Make room for hands-on learning. Write code, work through lessons, and build your understanding.",
    href: "/dashboard/playground",
    label: "Start practicing",
    color: "bg-emerald-50 text-emerald-700",
  },
];

export default function HomePage() {
  return (
    <div className="learning-page">
      <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <Badge
            variant="outline"
            className="mb-7 h-7 gap-2 bg-background px-3 text-xs"
          >
            <span className="size-1.5 rounded-full bg-primary" /> A little
            progress, every day
          </Badge>
          <h1 className="font-heading text-5xl font-semibold leading-[1.08] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Less scrolling.
            <br />
            More <span className="text-primary">building.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
            Make your next idea something real. Learn practical skills, explore
            new concepts, and put them to work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-11 gap-3 px-5">
              <Link href="/courses">
                Find your next course <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-5">
              <Link href="/system-design/playground">Try the playground</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {[
              "Learn at your pace",
              "Practice as you go",
              "Pick up where you left off",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="size-3.5 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="relative rounded-3xl border border-blue-100 bg-[#eaf0fb] p-5 sm:p-8">
          <div className="mb-5 flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium uppercase tracking-[0.16em]">
              The learning loop
            </span>
            <Layers3 className="size-4" />
          </div>
          <Card className="gap-0 py-0 shadow-lg shadow-blue-950/5">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Code2 className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    From concept to creation
                  </p>
                  <h2 className="mt-1 font-heading text-lg font-semibold">
                    Build something you understand.
                  </h2>
                </div>
              </div>
              <div
                className="my-6 rounded-xl bg-slate-950 p-5 font-mono text-[13px] leading-7 text-slate-300"
                role="img"
                aria-label="Code example: learn one new thing, build something small, and repeat."
              >
                <p>
                  <span className="text-blue-300">const</span> nextStep = {"{"}
                </p>
                <p className="pl-4">
                  learn:{" "}
                  <span className="text-emerald-300">
                    &quot;one new thing&quot;
                  </span>
                  ,
                </p>
                <p className="pl-4">
                  build:{" "}
                  <span className="text-emerald-300">
                    &quot;something small&quot;
                  </span>
                  ,
                </p>
                <p className="pl-4">
                  repeat: <span className="text-amber-200">true</span>
                </p>
                <p>{"};"}</p>
              </div>
              <div className="space-y-4">
                {[
                  "Understand the concept",
                  "Try it for yourself",
                  "Make it your own",
                ].map((step, i) => (
                  <div key={step} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-[11px] ${i === 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                    >
                      {i === 0 ? <Check className="size-3" /> : `0${i + 1}`}
                    </span>
                    <span
                      className={
                        i === 0 ? "font-medium" : "text-muted-foreground"
                      }
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <p className="mt-5 text-center text-xs text-slate-600">
            A simple approach. Skills that stay with you.
          </p>
        </div>
      </section>
      <Separator />
      <section className="mx-auto max-w-[1200px] px-6 py-14 md:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Follow your curiosity
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              What will you build next?
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Start with a course, explore a system, or jump straight into code.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {paths.map((path) => (
            <Card
              key={path.title}
              className="gap-0 bg-background py-0 shadow-none transition-shadow hover:shadow-md"
            >
              <CardContent className="flex h-full flex-col p-7">
                <div
                  className={`mb-7 flex size-11 items-center justify-center rounded-xl ${path.color}`}
                >
                  <path.icon className="size-5" />
                </div>
                <h3 className="font-heading text-xl font-semibold tracking-tight">
                  {path.title}
                </h3>
                <p className="mb-7 mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                  {path.description}
                </p>
                <Button
                  asChild
                  variant="link"
                  className="h-auto justify-start p-0"
                >
                  <Link href={path.href}>
                    {path.label}
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1200px] px-6 pb-16">
        <Card className="gap-0 border-0 bg-slate-950 py-0 text-white ring-0">
          <CardContent className="flex flex-col items-start justify-between gap-6 p-8 sm:p-10 md:flex-row md:items-center">
            <div>
              <BookOpen className="mb-4 size-6 text-blue-300" />
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Your next chapter starts here.
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Find a topic you care about. Take the first lesson.
              </p>
            </div>
            <Button
              asChild
              className="h-11 bg-white px-5 text-slate-950 hover:bg-slate-100"
            >
              <Link href="/courses">
                Browse the catalog <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
