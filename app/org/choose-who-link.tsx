import Link from "next/link";
import { BellRing } from "lucide-react";

/**
 * Sends the manager to the filtered learners list to remind people one by one
 * (issue #27), instead of a one-tap "remind everyone" — some staff shouldn't
 * be chased, for reasons the system can't know. Bulk chasing is still on
 * Learners → Admin behind a named group and a headcount.
 */
export function ChooseWhoLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors hover:bg-accent"
    >
      <BellRing className="size-3.5" />
      Choose who to remind
    </Link>
  );
}
