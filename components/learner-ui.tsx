import Link from "next/link";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { topicTheme, tint } from "@/lib/topic-theme";

/** Colourful stat tile with an icon chip. */
export function StatTile({
  label,
  value,
  icon: Icon,
  color = "#0d9488",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div
        className="flex size-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: tint(color), color }}
      >
        <Icon className="size-5" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** SVG progress ring with centred content. */
export function ProgressRing({
  value,
  size = 128,
  stroke = 12,
  color = "#0d9488",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const offset = c - (pct / 100) * c;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

/** Colour-coded topic pill. */
export function TopicBadge({ topic }: { topic?: string | null }) {
  const t = topicTheme(topic);
  const Icon = t.icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: tint(t.color), color: t.color }}
    >
      <Icon className="size-3.5" />
      {topic ?? "General"}
    </span>
  );
}

/** Prominent amber banner shown when action is needed. */
export function DueSoonBanner({
  count,
  href = "/learn/modules",
}: {
  count: number;
  href?: string;
}) {
  if (!count) return null;
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <AlertTriangle className="size-5 shrink-0" />
      <span>
        <strong>{count}</strong> training item{count === 1 ? "" : "s"} need your
        attention — overdue or expiring soon.
      </span>
    </Link>
  );
}

/** Gamification badge card (earned or locked). */
export function BadgeChip({
  label,
  description,
  icon: Icon,
  earned,
  color = "#0d9488",
}: {
  label: string;
  description: string;
  icon: LucideIcon;
  earned: boolean;
  color?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 text-center",
        earned ? "bg-card shadow-sm" : "bg-muted/40 opacity-60",
      )}
    >
      <div
        className="mx-auto flex size-11 items-center justify-center rounded-full"
        style={
          earned
            ? { backgroundColor: tint(color), color }
            : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }
        }
      >
        <Icon className="size-5" />
      </div>
      <p className="mt-2 text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
