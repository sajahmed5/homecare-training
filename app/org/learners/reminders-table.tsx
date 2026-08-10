export interface ReminderRow {
  id: string;
  toEmail: string;
  learnerName: string | null;
  subject: string;
  sent: boolean;
  createdAt: string;
}

function fmt(d: string): string {
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Every training reminder the org has sent, newest first (issue #13). */
export function RemindersTable({ rows }: { rows: ReminderRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border bg-card px-3 py-8 text-center text-sm text-muted-foreground">
        No reminders have been sent yet. Use the Remind buttons on the learners
        list to chase outstanding training.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Sent</th>
            <th className="px-3 py-2 font-medium">Learner</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Subject</th>
            <th className="px-3 py-2 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b last:border-0 hover:bg-accent/40">
              <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                {fmt(r.createdAt)}
              </td>
              <td className="px-3 py-2 font-medium">{r.learnerName ?? "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.toEmail}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.subject}</td>
              <td className="px-3 py-2 text-right">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.sent
                      ? "bg-green-100 text-green-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {r.sent ? "Delivered" : "Failed"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
