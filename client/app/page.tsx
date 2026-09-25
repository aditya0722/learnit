"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Play,
  Star,
  BookOpen,
  Users,
  Award,
  Clock,
  Code,
  Palette,
  Brain,
  BarChart3,
  Lightbulb,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import CoursePlayer from "@/components/course-player";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

const categories = [
  { icon: Code, label: "Web Development", count: "45 courses" },
  { icon: Palette, label: "UI/UX Design", count: "30 courses" },
  { icon: Brain, label: "Data Science", count: "25 courses" },
  { icon: BarChart3, label: "Business", count: "18 courses" },
  { icon: Lightbulb, label: "Product Management", count: "12 courses" },
  { icon: Shield, label: "Cybersecurity", count: "15 courses" },
];

const features = [
  {
    icon: Play,
    title: "Practical video lessons",
    description:
      "Clear, focused lessons from working professionals. No filler, no fluff — just the skills you need.",
  },
  {
    icon: BookOpen,
    title: "Hands-on projects",
    description:
      "Apply what you learn with real-world projects that build your portfolio and deepen understanding.",
  },
  {
    icon: Users,
    title: "Expert instructors",
    description:
      "Learn from people who do the work every day. Industry practitioners, not just educators.",
  },
  {
    icon: Clock,
    title: "Learn at your pace",
    description:
      "Study when it works for you. Bookmark your spot and pick up right where you left off.",
  },
  {
    icon: Award,
    title: "Recognized certificates",
    description:
      "Earn certificates that carry weight with employers and add real value to your resume.",
  },
  {
    icon: CheckCircle2,
    title: "Structured learning paths",
    description:
      "Follow curated sequences designed to take you from beginner to confident practitioner.",
  },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Software Engineer at Stripe",
    content:
      "The courses here are genuinely practical. I learned more in two months than I did in a year of scattered tutorials.",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Product Designer at Figma",
    content:
      "Clean, focused content from instructors who actually work in the field. Exactly what I was looking for.",
    rating: 5,
  },
  {
    name: "Maria Garcia",
    role: "Data Analyst at Notion",
    content:
      "The structured learning paths made all the difference. I went from basics to building real projects in weeks.",
    rating: 5,
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Get a feel for the platform",
    features: [
      "Access to 5 free courses",
      "Basic community access",
      "Email support",
    ],
    cta: "Start for free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Everything you need to level up",
    features: [
      "Unlimited course access",
      "Downloadable resources",
      "Certificate of completion",
      "Priority support",
      "Offline viewing",
      "Learning progress tracking",
    ],
    cta: "Start learning",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$99",
    period: "/month",
    description: "For organizations investing in their people",
    features: [
      "Everything in Pro",
      "Team admin dashboard",
      "Custom learning paths",
      "Usage analytics",
      "Dedicated account manager",
      "SSO integration",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

const companies = [
  "Google",
  "Stripe",
  "Figma",
  "Notion",
  "Vercel",
  "Linear",
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ==================== HERO ==================== */}
      <section className="bg-surface">
        <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                Learn without limits
              </p>
              <h1 className="text-4xl sm:text-[56px] font-bold text-navy tracking-tight leading-[1.05] mb-5">
                Build skills that
                <br />
                move your career
                <br />
                forward.
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-md mb-8">
                Learn practical skills from experienced instructors through
                focused courses designed to help you grow with confidence.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <Button asChild className="h-10 px-5">
                  <Link href="/courses">
                    Explore courses
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="h-10 px-5">
                  <Link href="/about">
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    See how it works
                  </Link>
                </Button>
              </div>
              {/* Social proof */}
              <div className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-2">
                  {["PS", "JW", "MG", "AK", "RT"].map((initials, i) => (
                    <div
                      key={initials}
                      className="w-8 h-8 rounded-full border-2 border-surface bg-navy text-white text-[10px] font-semibold flex items-center justify-center"
                      style={{ zIndex: 5 - i }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">12,000+</span>{" "}
                  learners enrolled
                </div>
              </div>
            </motion.div>

            {/* Right — Product preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="hidden lg:block"
            >
              <CoursePlayer />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== SOCIAL PROOF ==================== */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto max-w-[1200px] px-6 py-8">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider mb-6">
            Trusted by teams at
          </p>
          <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
            {companies.map((company) => (
              <span
                key={company}
                className="text-lg font-bold text-foreground/60 tracking-tight"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CATEGORIES ==================== */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mb-12"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              Browse by topic
            </p>
            <h2 className="text-3xl font-bold text-navy tracking-tight mb-3">
              Find your path
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Courses organized by discipline so you can focus on what matters
              most to your career.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeIn}
              >
                <Link href="/courses">
                  <div className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-white shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <cat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {cat.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cat.count}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURES ==================== */}
      <section className="py-20 md:py-28 bg-surface">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mb-12"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              Why Learnit
            </p>
            <h2 className="text-3xl font-bold text-navy tracking-tight mb-3">
              Designed for how people
              <br />
              actually learn
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We stripped away everything that gets in the way of learning and
              kept only what works.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeIn}
              >
                <div className="h-full p-6 rounded-lg border border-border bg-white shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mb-12"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-3xl font-bold text-navy tracking-tight mb-3">
              Simple, focused learning
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              No complicated onboarding. Just pick a course and start learning.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: "01",
                title: "Choose a course",
                desc: "Browse our catalog and find a course that matches your goals and current skill level.",
              },
              {
                num: "02",
                title: "Learn by doing",
                desc: "Watch focused lessons, complete exercises, and build real projects as you progress.",
              },
              {
                num: "03",
                title: "Earn your certificate",
                desc: "Complete the course and receive a certificate you can share with employers.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeIn}
              >
                <div className="relative">
                  {i < 2 && (
                    <div className="hidden md:block absolute top-6 left-8 right-0 h-px bg-border" />
                  )}
                  <span className="inline-block text-xs font-bold text-primary mb-3">
                    {step.num}
                  </span>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className="py-20 md:py-28 bg-surface">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mb-12"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              Testimonials
            </p>
            <h2 className="text-3xl font-bold text-navy tracking-tight mb-3">
              Hear from our learners
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Real stories from people who built real skills.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeIn}
              >
                <div className="h-full p-6 rounded-lg border border-border bg-white shadow-sm">
                  <div className="flex items-center gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-5">
                    &ldquo;{t.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-navy text-white text-xs font-semibold flex items-center justify-center">
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mb-12"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              Pricing
            </p>
            <h2 className="text-3xl font-bold text-navy tracking-tight mb-3">
              Start free, upgrade when
              <br />
              you&apos;re ready
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              No hidden fees. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 max-w-4xl">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeIn}
              >
                <div
                  className={`h-full flex flex-col p-6 rounded-lg border shadow-sm ${
                    plan.highlighted
                      ? "border-primary bg-white shadow-[0_2px_16px_rgba(37,99,235,0.12)]"
                      : "border-border bg-white"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="inline-block self-start text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded mb-3 uppercase tracking-wider">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <div className="mt-3 mb-1">
                    <span className="text-3xl font-bold text-navy">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">
                    {plan.description}
                  </p>
                  <Button
                    className="w-full mb-5 h-9"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/auth">{plan.cta}</Link>
                  </Button>
                  <ul className="space-y-2.5 mt-auto">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="py-20 md:py-28 bg-surface">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold text-navy tracking-tight mb-3">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
              Join thousands of learners building real skills for their careers.
              Start with a free course today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild className="h-10 px-5">
                <Link href="/auth">
                  Get started for free
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-10 px-5">
                <Link href="/courses">Browse all courses</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
