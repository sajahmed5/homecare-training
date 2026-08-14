import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssignForm } from "../assign-form";

/** Assign training — moved off the overview so it stays one page (design doc). */
export default async function AssignTrainingPage() {
  const context = await requireRole("org_admin");
  const supabase = await createClient();
  const [{ data: courses }, { data: pathways }, { data: staff }] =
    await Promise.all([
      supabase.from("courses").select("id, title").order("sort_order"),
      supabase.from("pathways").select("id, title").order("title"),
      supabase
        .from("users")
        .select("id, full_name, email, role, status")
        .order("created_at", { ascending: true }),
    ]);

  const activeStaff = (staff ?? []).filter(
    (u) => (u.status ?? "active") === "active",
  );

  return (
    <DashboardShell title="Assign training" context={context}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/org" className="text-sm text-muted-foreground hover:underline">
            ← Overview
          </Link>
          <Link
            href="/org/training"
            className="text-sm text-primary hover:underline"
          >
            View assigned training →
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assign training</CardTitle>
            <CardDescription>
              Assign one or more courses (or a whole pathway) to selected carers
              or everyone, with an optional due date.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignForm
              courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title }))}
              pathways={(pathways ?? []).map((p) => ({ id: p.id, title: p.title }))}
              staff={activeStaff.map((s) => ({
                id: s.id,
                name: s.full_name || s.email,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
