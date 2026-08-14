"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/org/learners", label: "Overview" },
  { href: "/org/learners/matrix", label: "Stats & matrix" },
  { href: "/org/learners/admin", label: "Admin" },
];

export function LearnersNav() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-xl border bg-card p-1 w-fit">
      {TABS.map((t) => {
        const active =
          t.href === "/org/learners"
            ? pathname === t.href
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? "bg-foreground text-background" : "hover:bg-accent"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
