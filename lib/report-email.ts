/**
 * The email a reporter gets when support updates their issue report
 * (issue #41). Pure, so the wording and the "is there anything to say" rule
 * can be tested without sending anything.
 */

import { esc } from "@/lib/engine-digest";

const STATUS_WORDS: Record<string, string> = {
  open: "Open",
  reviewing: "Being looked at",
  resolved: "Resolved",
};

export interface ReportChange {
  reportNo: number;
  summary: string;
  prevStatus: string;
  status: string;
  prevNote: string | null;
  note: string | null;
}

const clean = (s: string | null) => (s ?? "").trim();

/** Whether a save changed anything the reporter would care about. */
export function reportChanged(c: ReportChange): boolean {
  return c.prevStatus !== c.status || clean(c.prevNote) !== clean(c.note);
}

export function reportUpdateEmail(
  name: string | null,
  c: ReportChange,
  origin: string,
): { subject: string; html: string } {
  const statusChanged = c.prevStatus !== c.status;
  const word = STATUS_WORDS[c.status] ?? c.status;
  const subject = statusChanged
    ? `Your report #${c.reportNo} "${c.summary}" is now ${word.toLowerCase()}`
    : `Update on your report #${c.reportNo} "${c.summary}"`;

  const note = clean(c.note);
  const noteBlock = note
    ? `<p style="margin:16px 0 4px;font-weight:600">Note from the support team</p>
       <div style="white-space:pre-wrap;border-left:3px solid #2e7291;padding:8px 12px;background:#f3f7f9">${esc(note)}</div>`
    : "";

  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;color:#17222c">
    <h2 style="margin:0 0 16px">Your report has been updated</h2>
    <p>Hi ${esc(name?.trim() || "there")},</p>
    <p>Thanks for reporting <strong>#${c.reportNo} ${esc(c.summary)}</strong>.</p>
    <p>Status: <strong>${esc(word)}</strong>${statusChanged ? ` <span style="color:#4f6070">(was ${esc(STATUS_WORDS[c.prevStatus] ?? c.prevStatus)})</span>` : ""}</p>
    ${noteBlock}
    <p style="margin-top:20px"><a href="${origin}/report" style="display:inline-block;background:#2e7291;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">See my reports</a></p>
    <p style="color:#888;font-size:12px;margin-top:24px">My Care Academy — you're receiving this because you reported an issue.</p>
  </div>`;
  return { subject, html };
}
