"use client";

import { motion } from "framer-motion";
import {
  Target,
  Heart,
  Lightbulb,
  Users,
  ArrowRight,
  GraduationCap,
  Globe,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

const values = [
  {
    icon: Target,
    title: "Mission-driven",
    description:
      "We believe everyone deserves access to quality education regardless of their background or location.",
  },
  {
    icon: Heart,
    title: "Student first",
    description:
      "Every decision we make starts with the question: how does this help our students succeed?",
  },
  {
    icon: Lightbulb,
    title: "Practical approach",
    description:
      "We focus on skills that translate directly to the workplace. Theory matters, but application matters more.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "Learning is better together. We foster a supportive environment where everyone can grow.",
  },
];

const team = [
  {
    name: "Alex Morgan",
    role: "Founder & CEO",
    bio: "Former educator passionate about making quality education accessible to all.",
  },
  {
    name: "Jamie Lee",
    role: "Head of Curriculum",
    bio: "10+ years of experience designing courses that actually work.",
  },
  {
    name: "Chris Park",
    role: "Lead Engineer",
    bio: "Building the technology that powers seamless learning experiences.",
  },
  {
    name: "Sam Rivera",
    role: "Community Manager",
    bio: "Connecting learners worldwide and building an inclusive learning community.",
  },
];

const milestones = [
  {
    year: "2021",
    title: "Founded",
    description: "Learnit started with a simple idea: make learning accessible.",
  },
  {
    year: "2022",
    title: "1K Students",
    description: "Reached our first thousand students across 20 countries.",
  },
  {
    year: "2023",
    title: "10K Students",
    description: "Grew to 10,000 students with over 100 expert-led courses.",
  },
  {
    year: "2024",
    title: "Global Reach",
    description: "Expanded to 50+ countries with courses in multiple languages.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="bg-surface">
        <div className="mx-auto max-w-[1200px] px-6 pt-16 pb-16 md:pt-24 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              About us
            </p>
            <h1 className="text-4xl sm:text-[56px] font-bold text-navy tracking-tight leading-[1.05] mb-5">
              Education that
              <br />
              actually works.
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md">
              We&apos;re on a mission to empower the next generation of
              learners with world-class education that&apos;s accessible,
              affordable, and effective.
            </p>
          </motion.div>
        </div>
      </section>

      {/* STORY */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
                Our story
              </p>
              <h2 className="text-3xl font-bold text-navy tracking-tight mb-6">
                Started with a problem
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Learnit was born from a simple observation: traditional
                  education doesn&apos;t always prepare people for the real
                  world. We saw talented individuals struggling to break into
                  tech careers because they couldn&apos;t afford expensive
                  bootcamps or degrees.
                </p>
                <p>
                  In 2021, we set out to change that. Our platform brings
                  together industry experts and passionate learners in an
                  environment designed for real skill development — not just
                  theory.
                </p>
                <p>
                  Today, we&apos;re proud to have helped thousands of students
                  transition into new careers, level up their skills, and pursue
                  their passions. And we&apos;re just getting started.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { value: "10,000+", label: "Graduates", icon: GraduationCap },
                { value: "50+", label: "Countries", icon: Globe },
                { value: "95%", label: "Job placement", icon: TrendingUp },
                { value: "50+", label: "Expert mentors", icon: Users },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="p-5 rounded-lg border border-border bg-white shadow-sm"
                >
                  <stat.icon className="h-5 w-5 text-primary mb-3" />
                  <p className="text-2xl font-bold text-navy">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* VALUES */}
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
              Our values
            </p>
            <h2 className="text-3xl font-bold text-navy tracking-tight mb-3">
              What guides us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The principles that shape every decision we make.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeIn}
              >
                <div className="h-full p-5 rounded-lg border border-border bg-white shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
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
              Our journey
            </p>
            <h2 className="text-3xl font-bold text-navy tracking-tight mb-3">
              From idea to impact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              A brief look at how we got here.
            </p>
          </motion.div>

          <div className="relative max-w-3xl">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border" />
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeIn}
                className="relative flex items-start gap-8 mb-10 last:mb-0"
              >
                <div className="hidden md:block md:w-1/2" />
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary mt-2 z-10" />
                <div className="pl-12 md:pl-0 md:w-1/2 md:px-12">
                  <span className="inline-block text-xs font-semibold text-primary mb-1">
                    {m.year}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {m.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
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
              Team
            </p>
            <h2 className="text-3xl font-bold text-navy tracking-tight mb-3">
              The people behind Learnit
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Educators, engineers, and operators building the future of
              learning.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeIn}
              >
                <div className="h-full p-5 rounded-lg border border-border bg-white shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-navy text-white text-sm font-semibold flex items-center justify-center mb-4">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {member.name}
                  </h3>
                  <p className="text-xs text-primary font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-lg"
          >
            <h2 className="text-3xl font-bold text-navy tracking-tight mb-3">
              Join our community
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Be part of a growing community of learners and educators. Start
              your journey today.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Button asChild className="h-10 px-5">
                <Link href="/courses">
                  Explore courses
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-10 px-5">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
