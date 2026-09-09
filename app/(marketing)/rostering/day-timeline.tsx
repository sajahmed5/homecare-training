"use client";

import { useState } from "react";

/**
 * "A day with the system": what the software does hour by hour while the
 * office works. Every event is something the product actually does today.
 */
const DAY: { t: string; who: string; what: string; where: string }[] = [
  { t: "06:40", who: "Carer app", what: "Amina opens today's list: six visits, access notes and medication due on each.", where: "Carer app" },
  { t: "07:58", who: "Clock-in", what: "GPS clock-in at Elsie Grant's door, 12 metres out. The visit turns green on the office board.", where: "Live monitoring" },
  { t: "08:22", who: "Alert", what: "Arthur Bell's 08:00 call has not started. The office is alerted and it becomes a to-do with an owner.", where: "Alerts" },
  { t: "08:31", who: "Cover", what: "Dan is sent as cover for that one visit. The rota, the carer's phone and the family portal all update.", where: "Rostering" },
  { t: "10:15", who: "Care plan", what: "A new referral PDF is uploaded. The risk assessment and care plan are drafted for the coordinator to check.", where: "AI" },
  { t: "12:30", who: "Double-up", what: "Elsie's lunch call needs two carers. Both seats are filled and both clock in.", where: "Rostering" },
  { t: "14:05", who: "Supervision", what: "Chloe's supervision is recorded. Her overdue flag clears on the dashboard and Oversight.", where: "Quality" },
  { t: "17:10", who: "Hold", what: "Harold goes into hospital. A hold from 17:00 cancels tonight's call and stops the invoice from tomorrow.", where: "Rostering" },
  { t: "20:44", who: "Note", what: "Bed call done. A note and a photo go to the record; the family sees what you chose to share.", where: "Family portal" },
  { t: "Fri", who: "Finance", what: "Invoices, timesheets and road mileage for the fortnight are built from what actually happened.", where: "Finance" },
];

export default function DayTimeline() {
  const [i, setI] = useState(2);
  const ev = DAY[i];
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
      <ol className="relative border-l border-white/15 pl-6">
        {DAY.map((e, k) => (
          <li key={e.t + e.who} className="relative mb-1">
            <button
              type="button"
              onMouseEnter={() => setI(k)}
              onFocus={() => setI(k)}
              onClick={() => setI(k)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${k === i ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <span className={`absolute -left-[7px] size-3 rounded-full ${k === i ? "mca-pulse bg-[#3a9fc4]" : "bg-white/30"}`} />
              <span className="w-12 shrink-0 font-mono text-xs text-[#8fd3ea]">{e.t}</span>
              <span className={`text-sm ${k === i ? "text-white" : "text-white/70"}`}>{e.who}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="rounded-[2rem] bg-white/8 p-8 ring-1 ring-white/10">
        <div className="font-mono text-sm text-[#8fd3ea]">{ev.t}</div>
        <div className="font-display mt-2 text-2xl font-semibold text-white sm:text-3xl">{ev.who}</div>
        <p className="mt-4 text-lg text-white/80">{ev.what}</p>
        <span className="mt-6 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">{ev.where}</span>
      </div>
    </div>
  );
}
