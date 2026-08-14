import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { endOfMonthISO } from "@/lib/assign";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssignForm } from "../../assign-form";
import { BulkAssign } from "./bulk-assign";

/** Courses → Admin: assign training, one by one or in bulk. */
export default async function CoursesAdminPage() {
  await requireRole("org_admin");
  const supabase = await createClient();
  const [{ data: courses }, { data: pathways }, { data: staff }] =
    await Promise.all([
      supabase.from("courses").select("id, title").order("title"),
      supabase.from("pathways").select("id, title").order("title"),
      supabase
        .from("users")
        .select("id, full_name, email, role, status")
        .order("full_name", { ascending: true }),
    ]);

  const activeStaff = (staff ?? []).filter(
    (u) => (u.status ?? "active") === "active",
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign training</CardTitle>
          <CardDescription>
            Assign one or more courses (or a whole pathway) to selected carers
            or everyone. Every assignment gets a due date — it defaults to the
            end of this month.
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
            defaultDueDate={endOfMonthISO()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk assign from CSV</CardTitle>
          <CardDescription>
            Assign many courses to many staff in one upload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkAssign />
        </CardContent>
      </Card>
    </div>
  );
}
