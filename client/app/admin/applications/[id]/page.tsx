"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi, InstructorApplicationDetail } from "@/lib/api";
import { useSnackbar } from "@/components/snackbar-provider";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  User,
  Mail,
  Calendar,
  Briefcase,
  Globe,
  ExternalLink,
  BookOpen,
  Users,
  Clock,
  Award,
} from "lucide-react";
import Link from "next/link";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { toast } = useSnackbar();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin", "application", id],
    queryFn: () => adminApi.getApplicationDetail(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveApplication(id),
    onSuccess: () => {
      toast("Instructor approved successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "instructors"] });
      setApproveOpen(false);
      router.push("/admin/applications");
    },
    onError: () => {
      toast("Failed to approve instructor. Please try again.", "error");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectApplication(id),
    onSuccess: () => {
      toast("Instructor application rejected.", "info");
      queryClient.invalidateQueries({ queryKey: ["admin", "applications"] });
      setRejectOpen(false);
      router.push("/admin/applications");
    },
    onError: () => {
      toast("Failed to reject application. Please try again.", "error");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Application not found.</p>
        <Link href="/admin/applications">
          <Button variant="link" className="mt-2">Go back</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/applications">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy">Application Review</h1>
          <p className="text-sm text-muted-foreground">
            Full profile for {profile.userName}&apos;s instructor application
          </p>
        </div>
      </div>

      {/* Action buttons at the top */}
      <div className="flex gap-3">
        <Button
          onClick={() => setApproveOpen(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve Instructor
        </Button>
        <Button
          onClick={() => setRejectOpen(true)}
          variant="destructive"
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          Reject Application
        </Button>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
              {profile.userName?.split(" ").map((n) => n[0]).join("") || "?"}
            </div>
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{profile.userName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{profile.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="text-sm font-medium">{profile.userAge} years old</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium">
                      {new Date(profile.userCreatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{profile.userRole}</Badge>
                <Badge
                  variant="outline"
                  className="capitalize bg-amber-50 text-amber-700 border-amber-200"
                >
                  {profile.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructor Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            Instructor Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {profile.headline && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Headline</p>
              <p className="text-sm font-medium">{profile.headline}</p>
            </div>
          )}

          {profile.bio && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bio</p>
              <p className="text-sm leading-relaxed text-foreground">{profile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.expertise && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Expertise</p>
                <p className="text-sm font-medium">{profile.expertise}</p>
              </div>
            )}
            {profile.experienceYears != null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Experience</p>
                <p className="text-sm font-medium">{profile.experienceYears} years</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground mb-3">Social Links</p>
            <div className="flex flex-wrap gap-3">
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
              {profile.linkedin && (
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              )}
              {profile.github && (
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  GitHub
                </a>
              )}
              {!profile.website && !profile.linkedin && !profile.github && (
                <p className="text-xs text-muted-foreground">No social links provided</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground mb-3">Applied</p>
            <p className="text-sm font-medium">
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-navy">{profile.coursesCreated}</p>
              <p className="text-xs text-muted-foreground">Courses Created</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-navy">{profile.enrolledCourses}</p>
              <p className="text-xs text-muted-foreground">Enrolled Students</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-navy">{profile.experienceYears ?? 0}</p>
              <p className="text-xs text-muted-foreground">Years Experience</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Created (if any) */}
      {profile.userCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Courses by this Applicant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.userCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="text-sm font-medium">{course.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.duration} min · ${course.price}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {course.topics?.length || 0} topics
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve Instructor Application"
        description={`Are you sure you want to approve ${profile.userName} as an instructor? This will grant them instructor privileges and they will be able to create courses.`}
        confirmLabel="Approve"
        variant="default"
        onConfirm={() => approveMutation.mutate()}
        loading={approveMutation.isPending}
      />

      {/* Reject Dialog */}
      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Instructor Application"
        description={`Are you sure you want to reject ${profile.userName}'s instructor application? This action cannot be undone.`}
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={() => rejectMutation.mutate()}
        loading={rejectMutation.isPending}
      />
    </div>
  );
}
