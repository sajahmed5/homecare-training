"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getCertificateUrlAction } from "./quiz-actions";

export interface CertItem {
  id: string;
  number: string;
  courseTitle: string;
  issued: string;
  expires: string | null;
  expired: boolean;
}

export function CertificateList({ certs }: { certs: CertItem[] }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function download(id: string) {
    setBusy(id);
    const { url } = await getCertificateUrlAction(id);
    setBusy(null);
    if (url) window.open(url, "_blank");
  }

  if (certs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Pass a course assessment to earn your first certificate.
      </p>
    );
  }

  return (
    <ul className="divide-y text-sm">
      {certs.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{c.courseTitle}</p>
            <p className="text-xs text-muted-foreground">
              {c.number} · issued{" "}
              {new Date(c.issued).toLocaleDateString("en-GB")}
              {c.expires
                ? ` · ${c.expired ? "expired" : "expires"} ${new Date(
                    c.expires,
                  ).toLocaleDateString("en-GB")}`
                : " · no expiry"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => download(c.id)}
            disabled={busy === c.id}
          >
            {busy === c.id ? "…" : "Download"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
