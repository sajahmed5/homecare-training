import {
  BookOpen,
  Award,
  Clock,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { loadLearner } from "@/lib/learner-data";
import { deriveNotifications, type NotifType } from "@/lib/notifications";
import { tint } from "@/lib/topic-theme";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AutoMarkRead } from "./auto-mark-read";

const STYLE: Record<NotifType, { icon: LucideIcon; color: string }> = {
  assigned: { icon: BookOpen, color: "#0284c7" },
  certificate: { icon: Award, color: "#7c3aed" },
  expiring: { icon: Clock, color: "#d97706" },
  required: { icon: AlertTriangle, color: "#e11d48" },
};

export default async function NotificationsPage() {
  const context = await requireRole("learner");
  const supabase = await createClient();
  const data = await loadLearner(supabase);

  const notifs = deriveNotifications(
    data.enrolments.map((e) => ({
      course_id: e.course_id,
      status: e.status,
      assigned_at: e.assigned_at,
      title: e.title,
    })),
    data.certificates.map((c) => ({
      id: c.id,
      course_id: c.course_id,
      issued_at: c.issued_at,
      expires_at: c.expires_at,
      title: c.title,
    })),
    new Date(),
  );

  const readAt = data.readAt ? +new Date(data.readAt) : 0;

  return (
    <DashboardShell title="Notifications" context={context}>
      <AutoMarkRead />
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Assignments, new certificates and expiry reminders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You&apos;re all caught up 🎉
              </p>
            ) : (
              <ul className="divide-y">
                {notifs.map((n) => {
                  const s = STYLE[n.type];
                  const Icon = s.icon;
                  const unread = +new Date(n.at) > readAt;
                  return (
                    <li key={n.id} className="flex items-start gap-3 py-3">
                      <span
                        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: tint(s.color), color: s.color }}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {n.title}
                          {unread && (
                            <span className="ml-2 inline-block size-2 rounded-full bg-rose-500 align-middle" />
                          )}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {n.body}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(n.at).toLocaleDateString("en-GB")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
