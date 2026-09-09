"use client";

import { useState } from "react";
import { CalendarDays, GraduationCap } from "lucide-react";

/**
 * "A Tuesday at a care company" (home page). Saj liked the day idea but the
 * timeframe did not land, so this version is explicit: one named day, a
 * visible time axis from 06:00 to 22:00, and one card per moment saying
 * which product steps in. Click a card for the detail. Every moment is
 * something the products do today.
 */
type Moment = { t: string; hour: number; title: string; detail: string; product: "Rostering" | "Training" };

const DAY: Moment[] = [
  { t: "06:40", hour: 6.7, title: "Carer opens today's list", detail: "Six visits in order, each with the access notes, the tasks from the care plan and the medication due. On her own phone.", product: "Rostering" },
  { t: "07:58", hour: 8, title: "Clocked in at the door", detail: "GPS confirms she is at Elsie's address, 12 metres out. The visit turns green on the office board.", product: "Rostering" },
  { t: "08:22", hour: 8.4, title: "A call has not started", detail: "Arthur's 08:00 visit is 22 minutes late. The office is alerted, it becomes a to-do with an owner, and cover is sent for that one visit.", product: "Rostering" },
  { t: "12:30", hour: 12.5, title: "Two carers, one visit", detail: "Elsie's lunch call needs a double-up. Both seats are filled, both clock in, and the invoice and both timesheets know it.", product: "Rostering" },
  { t: "15:00", hour: 15, title: "Safeguarding passed, 92%", detail: "A carer finishes the course on her phone between visits. Twenty questions, 80% pass mark, a certificate anyone can verify.", product: "Training" },
  { t: "15:01", hour: 15.1, title: "Certificate lands in her record", detail: "No re-typing. The rota stops flagging her, and the Oversight page counts one fewer overdue.", product: "Training" },
  { t: "17:10", hour: 17.2, title: "Harold goes into hospital", detail: "A hold from 17:00 cancels tonight's call and stops the invoice from tomorrow. His carer's evening is freed on the rota.", product: "Rostering" },
  { t: "20:44", hour: 20.7, title: "Bed call done, note and photo", detail: "The note and photo go to Elsie's record. Her daughter sees what you chose to share on the family portal.", product: "Rostering" },
];

export default function CareDay() {
  const [i, setI] = useState(2);
  const m = DAY[i];
  const left = (h: number) => `${((h - 6) / 16) * 100}%`;
  return (
    <div>
      {/* Time axis */}
      <div className="relative mt-2 hidden h-16 md:block">
        <div className="absolute left-0 right-0 top-8 h-px bg-[#134f63]/20" />
        {[6, 8, 10, 12, 14, 16, 18, 20, 22].map((h) => (
          <div key={h} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: left(h) }}>
            <div className="font-mono text-[11px] text-[#0f2f3c]/50">{String(h).padStart(2, "0")}:00</div>
            <div className="mx-auto mt-1 h-3 w-px bg-[#134f63]/25" />
          </div>
        ))}
        {DAY.map((d, k) => (
          <button
            key={d.t}
            type="button"
            aria-label={`${d.t} ${d.title}`}
            onClick={() => setI(k)}
            onMouseEnter={() => setI(k)}
            className={`absolute top-8 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-white transition ${
              k === i ? "mca-pulse scale-125 " : ""
            }${d.product === "Training" ? "bg-[#b7791f]" : "bg-[#1d6f8a]"}`}
            style={{ left: left(d.hour) }}
          />
        ))}
      </div>

      {/* Moments */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DAY.map((d, k) => {
          const on = k === i;
          const training = d.product === "Training";
          return (
            <button
              key={d.t}
              type="button"
              onClick={() => setI(k)}
              onMouseEnter={() => setI(k)}
              className={`rounded-2xl p-4 text-left ring-1 transition ${
                on
                  ? training ? "bg-[#fff8ee] ring-[#b7791f]/40 shadow-md" : "bg-[#eef6fa] ring-[#1d6f8a]/40 shadow-md"
                  : "bg-white ring-[#134f63]/10 hover:-translate-y-0.5 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs ${training ? "text-[#b7791f]" : "text-[#1d6f8a]"}`}>{d.t}</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${training ? "bg-[#b7791f]/10 text-[#b7791f]" : "bg-[#1d6f8a]/10 text-[#1d6f8a]"}`}>
                  {training ? <GraduationCap className="size-3" /> : <CalendarDays className="size-3" />}
                  {d.product}
                </span>
              </div>
              <div className="mt-2 text-sm font-semibold text-[#0f2f3c]">{d.title}</div>
            </button>
          );
        })}
      </div>

      {/* Detail */}
      <div className={`mt-4 rounded-[1.5rem] p-6 ring-1 ${m.product === "Training" ? "bg-[#fff8ee] ring-[#b7791f]/25" : "bg-[#eef6fa] ring-[#1d6f8a]/20"}`}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className={`font-mono text-sm ${m.product === "Training" ? "text-[#b7791f]" : "text-[#1d6f8a]"}`}>Tuesday · {m.t}</span>
          <span className="font-display text-xl font-semibold text-[#0f2f3c]">{m.title}</span>
        </div>
        <p className="mt-2 max-w-3xl text-[#0f2f3c]/75">{m.detail}</p>
      </div>
    </div>
  );
}
