/** Send an email via Resend. Returns true if dispatched. */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "My Care Academy <onboarding@resend.dev>";
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error("Resend send failed:", res.status);
    return res.ok;
  } catch (err) {
    console.error("Resend send error:", err);
    return false;
  }
}

interface InviteEmailOptions {
  to: string;
  inviteUrl: string;
  /** e.g. "organisation administrator", "learner". */
  roleLabel: string;
  /** Organisation the invitee is joining, if any. */
  orgName?: string | null;
}

export interface SendResult {
  /** True if an email was actually dispatched via Resend. */
  sent: boolean;
  /** The invite URL — returned so the UI can show a copyable link fallback. */
  link: string;
}

/**
 * Sends a branded invite email via Resend. If RESEND_API_KEY is not configured
 * (or the send fails), returns sent:false with the link so the caller can show
 * a copyable invite link instead — invites still work without email set up.
 */
export async function sendInviteEmail({
  to,
  inviteUrl,
  roleLabel,
  orgName,
}: InviteEmailOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "My Care Academy <onboarding@resend.dev>";

  if (!apiKey) return { sent: false, link: inviteUrl };

  const joining = orgName ? ` for <strong>${orgName}</strong>` : "";
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto">
      <h2>You've been invited to My Care Academy</h2>
      <p>You've been invited as ${roleLabel}${joining}. Click below to set your
      password and get started.</p>
      <p style="margin:24px 0">
        <a href="${inviteUrl}"
           style="background:#111;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">
          Accept invitation
        </a>
      </p>
      <p style="color:#666;font-size:13px">If the button doesn't work, paste this
      link into your browser:<br>${inviteUrl}</p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "Your My Care Academy invitation",
        html,
      }),
    });
    if (!res.ok) {
      console.error("Resend send failed:", res.status, await res.text());
      return { sent: false, link: inviteUrl };
    }
    return { sent: true, link: inviteUrl };
  } catch (err) {
    console.error("Resend send error:", err);
    return { sent: false, link: inviteUrl };
  }
}
