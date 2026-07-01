import { Button } from "@/components/ui/button";
import type { UserContext } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  platform_admin: "Platform admin",
  org_admin: "Organisation admin",
  learner: "Learner",
};

export function DashboardShell({
  title,
  context,
  children,
}: {
  title: string;
  context: UserContext;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {context.role ? ROLE_LABELS[context.role] : "No role assigned"}
          </p>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {context.email}
          </span>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
