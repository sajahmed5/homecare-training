"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Bell,
  Award,
  User,
  Users,
  Building2,
  BarChart3,
  FileText,
  Briefcase,
  ClipboardCheck,
  Bug,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth";

interface NavChild {
  href: string;
  label: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only show when this org add-on flag is enabled (org_admin add-ons). */
  flag?: "forms_enabled" | "recruitment_enabled" | "observations_enabled";
  /** Sub-pages listed under the heading in the left panel (design doc v2). */
  children?: NavChild[];
}

const NAV: Record<string, NavItem[]> = {
  platform_admin: [
    { href: "/platform", label: "Overview", icon: LayoutDashboard },
    { href: "/platform/organisations", label: "Organisations", icon: Building2 },
    { href: "/platform/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/platform/courses", label: "Courses", icon: BookOpen },
    { href: "/platform/reports", label: "Issues", icon: Bug },
    { href: "/platform/billing", label: "Billing", icon: CreditCard },
    { href: "/platform/settings", label: "Automation", icon: Bell },
  ],
  org_admin: [
    { href: "/org", label: "Overview", icon: LayoutDashboard },
    {
      href: "/org/learners",
      label: "Learners",
      icon: Users,
      children: [
        { href: "/org/learners", label: "Overview" },
        { href: "/org/learners/statistics", label: "Statistics" },
        { href: "/org/learners/admin", label: "Admin" },
      ],
    },
    {
      href: "/org/courses",
      label: "Courses",
      icon: BookOpen,
      children: [
        { href: "/org/courses", label: "Overview" },
        { href: "/org/courses/statistics", label: "Statistics" },
        { href: "/org/courses/admin", label: "Admin" },
      ],
    },
    { href: "/org/certificates", label: "Certificates", icon: Award },
    { href: "/org/forms", label: "Forms", icon: FileText, flag: "forms_enabled" },
    { href: "/org/recruitment", label: "Recruitment", icon: Briefcase, flag: "recruitment_enabled" },
    { href: "/org/observations", label: "CC assessment", icon: ClipboardCheck, flag: "observations_enabled" },
    { href: "/org/reports", label: "Reports", icon: FileBarChart },
    { href: "/org/billing", label: "Account", icon: CreditCard },
  ],
  learner: [
    { href: "/learn", label: "Dashboard", icon: LayoutDashboard },
    { href: "/learn/modules", label: "Training", icon: BookOpen },
    { href: "/learn/certificates", label: "Certificates", icon: Award },
    { href: "/learn/notifications", label: "Notifications", icon: Bell },
    { href: "/learn/profile", label: "Profile", icon: User },
  ],
};

/** Section roots whose parent item only highlights on an exact match. */
const SECTION_ROOTS = ["/platform", "/org", "/learn"];

function isActive(pathname: string, href: string, exact = false): boolean {
  if (pathname === href) return true;
  if (exact || SECTION_ROOTS.includes(href)) return false;
  return pathname.startsWith(href);
}

export function SidebarNav({
  role,
  orientation = "vertical",
  badges = {},
  enabled = {},
  collapsed = false,
}: {
  role: UserRole | null;
  orientation?: "vertical" | "horizontal";
  badges?: Record<string, number>;
  /** Org add-on flags — items with a `flag` only show when enabled here. */
  enabled?: Record<string, boolean>;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const items = (role ? (NAV[role] ?? []) : []).filter(
    (item) => !item.flag || enabled[item.flag],
  );

  return (
    <nav
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-1"
          : "flex gap-1 overflow-x-auto",
      )}
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        const badge = badges[item.href] ?? 0;
        // A child is "exact" when it shares the parent's href (Overview).
        const children =
          !collapsed && orientation === "vertical" ? (item.children ?? []) : [];
        return (
          <div key={item.href} className={orientation === "vertical" ? "" : "flex gap-1"}>
            <Link
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "gap-3",
                active && (children.length === 0 || pathname === item.href)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <span className="relative">
                <Icon className="size-4" />
                {collapsed && badge > 0 && (
                  <span className="absolute -right-1 -top-1 size-2 rounded-full bg-rose-500" />
                )}
              </span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && badge > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
                  {badge}
                </span>
              )}
            </Link>
            {children.length > 0 && (
              <div className="ml-5 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-foreground/15 pl-3">
                {children.map((c) => {
                  const childActive = isActive(
                    pathname,
                    c.href,
                    c.href === item.href,
                  );
                  return (
                    <Link
                      key={`${c.href}-${c.label}`}
                      href={c.href}
                      className={cn(
                        "rounded-md px-2 py-1 text-[13px] transition-colors",
                        childActive
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )}
                    >
                      {c.label}
                    </Link>
                  );
                })}
              </div>
            )}
            {/* Horizontal (mobile) mode: children render as extra pills when the section is active. */}
            {orientation === "horizontal" &&
              active &&
              (item.children ?? []).map((c) => (
                <Link
                  key={`${c.href}-${c.label}`}
                  href={c.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive(pathname, c.href, c.href === item.href)
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60",
                  )}
                >
                  {c.label}
                </Link>
              ))}
          </div>
        );
      })}
    </nav>
  );
}
