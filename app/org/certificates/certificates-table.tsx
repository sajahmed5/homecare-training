"use client";

import Link from "next/link";
import type { CertState, OrgCertificateRow } from "@/lib/certificates";

const csvCell = (v: string) =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const BADGE: Record<CertState, { label: string; cls: string }> = {
  expired: { label: "Expired", cls: "bg-rose-100 text-rose-700" },
  due_30: { label: "Due ≤30 days", cls: "bg-amber-100 text-amber-800" },
  due_60: { label: "Due 31–60 days", cls: "bg-yellow-100 text-yellow-800" },
  valid: { label: "Valid", cls: "bg-green-100 text-green-700" },
  no_expiry: { label: "No expiry", cls: "bg-slate-100 text-slate-700" },
};

/** "expired 12 days ago" / "in 9 days" — the urgency in plain words. */
function whenText(r: OrgCertificateRow): string {
  if (r.daysLeft === null) return "Never expires";
  if (r.daysLeft < 0) {
    const n = Math.abs(r.daysLeft);
    return `${n} day${n === 1 ? "" : "s"} ago`;
  }
  if (r.daysLeft === 0) return "Today";
  return `in ${r.daysLeft} day${r.daysLeft === 1 ? "" : "s"}`;
}

export function CertificatesTable({
  rows,
  filename = "certificates.csv",
}: {
  rows: OrgCertificateRow[];
  filename?: string;
}) {
  function exportCsv() {
    const header = [
      "Learner",
      "Course",
      "Certificate number",
      "Issued",
      "Expires",
      "Status",
      "Days remaining",
    ];
    const body = rows.map((r) =>
      [
        r.learner,
        r.course,
        r.number,
        fmtDate(r.issuedAt),
        fmtDate(r.expiresAt),
        BADGE[r.state].label,
        r.daysLeft === null ? "" : String(r.daysLeft),
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = "﻿" + [header.map(csvCell).join(","), ...body].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Learner</th>
              <th className="px-3 py-2 font-medium">Course</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Expires</th>
              <th className="px-3 py-2 font-medium">Issued</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  Nothing here — no certificates match this filter.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const badge = BADGE[r.state];
                return (
                  <tr
                    key={r.id}
                    className="border-b last:border-0 hover:bg-accent/40"
                  >
                    <td className="px-3 py-2">
                      <Link
                        href={`/org/staff/${r.userId}`}
                        className="font-medium hover:underline"
                      >
                        {r.learner}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {/* Same org-scoped download the statistics table uses. */}
                      <a
                        href={`/org/certificates/${r.id}/download`}
                        className="font-medium hover:underline"
                        title={`Download ${r.learner}'s certificate`}
                      >
                        {r.course}
                      </a>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtDate(r.expiresAt)}
                      <span
                        className={`block text-xs ${
                          r.state === "expired"
                            ? "text-rose-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {whenText(r)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {fmtDate(r.issuedAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border px-3 py-1 text-sm font-medium transition-colors hover:bg-accent"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
