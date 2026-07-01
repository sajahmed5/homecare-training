import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/sidebar-nav";
import { createClient } from "@/lib/supabase/server";
import { loadLearner } from "@/lib/learner-data";
import { deriveNotifications, unreadCount } from "@/lib/notifications";
import type { UserContext } from "@/lib/auth";

async function learnerBadges(
  context: UserContext,
): Promise<Record<string, number>> {
  if (context.role !== "learner") return {};
  try {
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
    return { "/learn/notifications": unreadCount(notifs, data.readAt) };
  } catch {
    return {};
  }
}

const ROLE_LABELS: Record<string, string> = {
  platform_admin: "Platform admin",
  org_admin: "Organisation admin",
  learner: "Learner",
};

function SignOut({ className }: { className?: string }) {
  return (
    <form action="/auth/signout" method="post" className={className}>
      <Button type="submit" variant="outline" size="sm" className="w-full">
        Sign out
      </Button>
    </form>
  );
}

export async function DashboardShell({
  title,
  context,
  children,
}: {
  title: string;
  context: UserContext;
  children?: React.ReactNode;
}) {
  const badges = await learnerBadges(context);
  return (
    <div className="flex min-h-svh w-full">
      {/* Sidebar — desktop */}
      <aside className="hidden w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="p-4">
          <div className="inline-flex rounded-lg bg-white px-3 py-2 shadow-sm">
            <Logo width={140} />
          </div>
        </div>
        <div className="flex-1 px-3">
          <SidebarNav role={context.role} badges={badges} />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <p className="text-xs text-sidebar-foreground/60">
            {context.role ? ROLE_LABELS[context.role] : "No role"}
          </p>
          <p className="mb-2 truncate text-sm">{context.email}</p>
          <SignOut />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-card/85 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex rounded bg-white px-2 py-1 shadow-sm md:hidden">
              <Logo width={104} />
            </div>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {context.email}
            </span>
            <form action="/auth/signout" method="post" className="md:hidden">
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>

        {/* Mobile nav strip */}
        <div className="bg-sidebar px-3 py-2 md:hidden">
          <SidebarNav role={context.role} orientation="horizontal" badges={badges} />
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
