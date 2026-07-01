import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CoursesAdminPage() {
  const context = await requireRole("platform_admin");

  const supabase = await createClient();
  const [{ data: courses }, { data: questions }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, topics(title)")
      .order("sort_order"),
    supabase.from("quiz_questions").select("course_id"),
  ]);

  const counts = new Map<string, number>();
  for (const q of questions ?? []) {
    counts.set(q.course_id, (counts.get(q.course_id) ?? 0) + 1);
  }

  return (
    <DashboardShell title="Courses & question banks" context={context}>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/platform" className="text-sm text-muted-foreground hover:underline">
          ← Back to console
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Course catalogue</CardTitle>
            <CardDescription>
              Manage each course&apos;s assessment question bank (aim for ~50 per
              course).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">Course</th>
                    <th className="py-2 font-medium">Topic</th>
                    <th className="py-2 font-medium">Questions</th>
                    <th className="py-2 font-medium text-right">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {(courses ?? []).map((c) => {
                    const topic = (c.topics as unknown as { title: string } | null)
                      ?.title;
                    return (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 font-medium">{c.title}</td>
                        <td className="py-2 text-muted-foreground">{topic}</td>
                        <td className="py-2">{counts.get(c.id) ?? 0}</td>
                        <td className="py-2 text-right">
                          <Link
                            href={`/platform/courses/${c.id}`}
                            className={buttonVariants({
                              size: "sm",
                              variant: "outline",
                            })}
                          >
                            Questions
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
