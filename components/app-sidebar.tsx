"use client";

import { useEffect, useState } from "react";
import { PanelLeftClose, PanelLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/sidebar-nav";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/auth";

const KEY = "mca-sidebar-collapsed";

export function AppSidebar({
  role,
  email,
  roleLabel,
  badges,
}: {
  role: UserRole | null;
  email: string | null;
  roleLabel: string;
  badges: Record<string, number>;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(KEY) === "1") setCollapsed(true);
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(KEY, next ? "1" : "0");
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 p-3",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <div className="inline-flex rounded-lg bg-white px-3 py-2 shadow-sm">
            <Logo width={124} />
          </div>
        )}
        <button
          onClick={toggle}
          title={collapsed ? "Expand" : "Collapse"}
          className="rounded-lg p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <PanelLeft className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </button>
      </div>

      <div className="flex-1 px-3">
        <SidebarNav role={role} badges={badges} collapsed={collapsed} />
      </div>

      <div className="border-t border-sidebar-border p-3">
        {collapsed ? (
          <form action="/auth/signout" method="post" className="flex justify-center">
            <button
              type="submit"
              title="Sign out"
              className="rounded-lg p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            >
              <LogOut className="size-5" />
            </button>
          </form>
        ) : (
          <>
            <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
            <p className="mb-2 truncate text-sm">{email}</p>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                Sign out
              </Button>
            </form>
          </>
        )}
      </div>
    </aside>
  );
}
