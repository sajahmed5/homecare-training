import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteStaffForm } from "../../invite-staff-form";
import { CsvImport } from "../../csv-import";
import { CsvExport } from "../../csv-export";
import { StatusToggle } from "../../status-toggle";
import { DeleteStaffButton } from "../../delete-staff-button";
import { NudgeAllButton } from "../../nudge-all-button";
import { NudgeNeverSignedInButton } from "../../nudge-never-signed-in-button";
import { NUDGE_TYPES } from "../../nudge-types";
import { RemindersTable, type ReminderRow } from "../reminders-table";

const ROLE_LABELS: Record<string, string> = {
  org_admin: "Admin",
  learner: "Learner",
};

/**
 * Admin: add, deactivate and remove staff (learners and admin users alike),
 * plus the reminder history and bulk-remind (design doc v2).
 */
export default async function LearnersAdminPage() {
  const context = await requireRole("org_admin");
  const supabase = await createClient();
  const [
    { data: organisation },
    { data: staff },
    { data: nudgeLog },
    { data: lastSignInNudge },
  ] =
    await Promise.all([
      supabase.from("organisations").select("name").single(),
      supabase
        .from("users")
        .select("id, full_name, email, role, status, created_at, last_seen_at")
        .order("created_at", { ascending: true }),
      supabase
        .from("email_log")
        .select("id, to_email, subject, sent, created_at, type")
        .in("type", NUDGE_TYPES)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("email_log")
        .select("created_at")
        .eq("type", "org_signin_nudge")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  // Same group the action targets: active learners who have never signed in.
  const neverSignedIn = (staff ?? []).filter(
    (u) => u.role === "learner" && u.status === "active" && !u.last_seen_at,
  ).length;
  const lastSignInNudgeAt = lastSignInNudge?.created_at ?? null;

  const nameByEmail = new Map<string, string>();
  for (const u of staff ?? []) {
    if (u.email) nameByEmail.set(u.email.toLowerCase(), u.full_name || u.email);
  }
  const reminders: ReminderRow[] = (nudgeLog ?? []).map((l) => ({
    id: l.id,
    toEmail: l.to_email,
    learnerName: nameByEmail.get(l.to_email.toLowerCase()) ?? null,
    subject: l.subject,
    sent: l.sent,
    createdAt: l.created_at,
  }));

  const exportRows = (staff ?? []).map((u) => ({
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    status: u.status ?? "active",
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Staff</CardTitle>
            <CardDescription>
              {staff?.length ?? 0} member(s) — admins and learners.
            </CardDescription>
          </div>
          <CsvExport
            rows={exportRows}
            filename={`${organisation?.name ?? "staff"}-staff.csv`}
          />
        </CardHeader>
        <CardContent>
          {/* Desktop: table (boxed + scrollable so it doesn't swallow the page) */}
          <div className="hidden max-h-96 overflow-y-auto rounded-xl border md:block">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(staff ?? []).map((u) => {
                  const status = u.status ?? "active";
                  const isSelf = u.id === context.userId;
                  return (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <Link
                          href={`/org/staff/${u.id}`}
                          className="font-medium hover:underline"
                        >
                          {u.full_name || u.email}
                        </Link>{" "}
                        <span className="text-muted-foreground">{u.email}</span>
                      </td>
                      <td className="px-3 py-2">
                        {ROLE_LABELS[u.role] ?? u.role}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          variant={
                            status === "deactivated" ? "destructive" : "secondary"
                          }
                        >
                          {status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">You</span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <StatusToggle userId={u.id} status={status} />
                            <DeleteStaffButton
                              userId={u.id}
                              name={u.full_name || u.email}
                            />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="max-h-96 space-y-2 overflow-y-auto md:hidden">
            {(staff ?? []).map((u) => {
              const status = u.status ?? "active";
              const isSelf = u.id === context.userId;
              return (
                <div key={u.id} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/org/staff/${u.id}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {u.full_name || u.email}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email}
                      </p>
                    </div>
                    <Badge
                      variant={
                        status === "deactivated" ? "destructive" : "secondary"
                      }
                    >
                      {status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                    {isSelf ? (
                      <span className="text-xs text-muted-foreground">You</span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <StatusToggle userId={u.id} status={status} />
                        <DeleteStaffButton
                          userId={u.id}
                          name={u.full_name || u.email}
                        />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Reminders</CardTitle>
            <CardDescription>
              Every reminder sent, newest first. Chase everyone with overdue
              training, or everyone who has never signed in.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NudgeAllButton />
            <NudgeNeverSignedInButton
              count={neverSignedIn}
              lastSentAt={lastSignInNudgeAt}
            />
          </div>
        </CardHeader>
        <CardContent>
          <RemindersTable rows={reminders} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invite a staff member</CardTitle>
            <CardDescription>
              They&apos;ll get an email to join and set a password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteStaffForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk import</CardTitle>
            <CardDescription>Invite many staff from a CSV.</CardDescription>
          </CardHeader>
          <CardContent>
            <CsvImport />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
