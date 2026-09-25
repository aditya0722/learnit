"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { adminApi, type AdminDashboardStats } from "@/lib/api";
import Link from "next/link";

const fadeIn = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  index,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="p-5 rounded-xl border border-border bg-white shadow-sm"
    >
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-bold text-navy tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform overview and key metrics.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          color="bg-blue-50 text-blue-600"
          index={0}
        />
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={stats?.totalCourses ?? 0}
          color="bg-emerald-50 text-emerald-600"
          index={1}
        />
        <StatCard
          icon={GraduationCap}
          label="Enrollments"
          value={stats?.totalEnrollments ?? 0}
          color="bg-purple-50 text-purple-600"
          index={2}
        />
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
          color="bg-amber-50 text-amber-600"
          index={3}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Recent enrollments */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-xl border border-border bg-white shadow-sm"
        >
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy">Recent Enrollments</h3>
            <Link
              href="/admin/courses"
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {stats?.recentEnrollments && stats.recentEnrollments.length > 0 ? (
              stats.recentEnrollments.map((e) => (
                <div key={e.id} className="px-6 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {e.courseName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {e.userName} &middot; {e.userEmail}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold text-navy">${Number(e.price).toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                No enrollments yet.
              </div>
            )}
          </div>
        </motion.div>

        {/* Role breakdown + quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          className="space-y-4"
        >
          {/* Role breakdown */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-navy mb-4">User Roles</h3>
            <div className="space-y-3">
              {stats?.roleBreakdown.map((r) => {
                const total = stats.totalUsers || 1;
                const pct = Math.round((r.value / total) * 100);
                return (
                  <div key={r.role}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm capitalize text-foreground">{r.role}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.value} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-navy mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/admin/users"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Manage Users</p>
                  <p className="text-xs text-muted-foreground">View, edit roles, delete</p>
                </div>
              </Link>
              <Link
                href="/admin/courses"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Manage Courses</p>
                  <p className="text-xs text-muted-foreground">View details, remove courses</p>
                </div>
              </Link>
              <Link
                href="/admin/instructors"
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Manage Instructors</p>
                  <p className="text-xs text-muted-foreground">Review and manage profiles</p>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
