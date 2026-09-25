"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Eye, Clock, Mail } from "lucide-react";

export default function ApplicationsPage() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: adminApi.getApplications,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pending = applications?.filter((a) => a.status === "pending") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Instructor Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage instructor applications
        </p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No pending applications</h3>
            <p className="text-sm text-muted-foreground">
              All instructor applications have been reviewed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pending.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
                      {app.userName?.split(" ").map((n) => n[0]).join("") || "?"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{app.userName}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" />
                        {app.userEmail}
                      </p>
                      {app.headline && (
                        <p className="text-sm text-foreground mt-2 font-medium">{app.headline}</p>
                      )}
                      {app.expertise && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expertise: {app.expertise}
                          {app.experienceYears ? ` · ${app.experienceYears} years` : ""}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {app.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Applied {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/admin/applications/${app.id}`}>
                    <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Review
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
