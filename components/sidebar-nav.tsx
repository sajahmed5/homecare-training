"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Bell,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: Record<string, NavItem[]> = {
  platform_admin: [
    { href: "/platform", label: "Overview", icon: LayoutDashboard },
    { href: "/platform/courses", label: "Courses", icon: BookOpen },
    { href: "/platform/billing", label: "Billing", icon: CreditCard },
    { href: "/platform/settings", label: "Automation", icon: Bell },
  ],
  org_admin: [
    { href: "/org", label: "Overview", icon: LayoutDashboard },
    { href: "/org/billing", label: "Billing", icon: CreditCard },
  ],
  learner: [{ href: "/learn", label: "My training", icon: GraduationCap }],
};

export function SidebarNav({
  role,
  orientation = "vertical",
}: {
  role: UserRole | null;
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();
  const items = role ? (NAV[role] ?? []) : [];

  return (
    <nav
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-1"
          : "flex gap-1 overflow-x-auto",
      )}
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/platform" &&
            item.href !== "/org" &&
            item.href !== "/learn" &&
            pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
