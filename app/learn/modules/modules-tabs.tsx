"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/learn/modules", label: "Assigned" },
  { href: "/learn/modules/completed", label: "Completed" },
  { href: "/learn/modules/all", label: "All courses" },
];

export function ModulesTabs() {
  const pathname = usePathname();
  return (
    <div className="inline-flex rounded-xl border bg-card p-1">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
