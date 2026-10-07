/**
 * What the badges mean.
 *
 * The console shows nine status words across three screens and explained
 * none of them: a manager could not tell from the screen that "Expired" means
 * they passed it once and it has lapsed, that "Assessment due" means they've
 * read everything but not sat the test, or that "Late" and "Overdue" are
 * different things (usability audit, 7 Oct 2026).
 *
 * A <details> rather than a tooltip: it works on a phone, it prints, and it
 * stays out of the way once someone has learnt them.
 */
const TRAINING: [string, string][] = [
  ["Not started", "Assigned, but they haven't opened it yet."],
  ["In progress", "They've started and have pages left to read."],
  ["Assessment due", "They've read everything but haven't passed the test yet."],
  ["Completed", "Passed, with a certificate issued."],
  ["Overdue", "Past its due date and not finished. The most urgent one."],
  ["Late", "They did finish it — after the due date. Done, but worth knowing."],
  ["Expired", "They passed it once and the certificate has lapsed. Needs retaking."],
];

const CERTIFICATES: [string, string][] = [
  ["Valid", "In date, nothing to do."],
  ["Due ≤30 days", "Lapses within a month — book the retake now."],
  ["Due 31–60 days", "Lapses within two months."],
  ["Expired", "Already lapsed. They are no longer covered for that subject."],
  ["No expiry", "This course doesn't expire, so there is nothing to renew."],
];

export function StatusKey({ kind }: { kind: "training" | "certificates" }) {
  const items = kind === "training" ? TRAINING : CERTIFICATES;
  return (
    <details className="rounded-2xl border bg-card px-4 py-3 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center font-medium sm:min-h-0">
        What do these statuses mean?
      </summary>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map(([label, meaning]) => (
          <div key={label} className="grid grid-cols-[9rem_1fr] gap-2">
            <dt className="font-semibold">{label}</dt>
            <dd className="text-muted-foreground">{meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
