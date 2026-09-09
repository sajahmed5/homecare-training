"use client";

import { useState } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  PoundSterling,
  Smartphone,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Click-through tour of the real product (Saj, 9 Sept 2026: "when we click on
 * rostering, carer app, live monitoring etc it actually shows us the page
 * dedicated to that section — gives the user an insight into the app without
 * actually getting a demo"). Every image is a genuine capture from the demo
 * company; a section without one yet says so rather than showing a mock.
 */
type Stop = {
  id: string;
  label: string;
  icon: LucideIcon;
  title: string;
  caption: string;
  src?: string;
  more?: string;
};

const STOPS: Stop[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    title: "Everything that needs you, on one screen",
    caption: "Cover mismatches, double bookings, your actions, complaints, documents and today's numbers, the moment you sign in.",
    src: "/rostering/dashboard.png",
    more: "#monitoring",
  },
  {
    id: "rota",
    label: "Rostering",
    icon: CalendarDays,
    title: "A carer's week at a glance",
    caption: "Every visit the carer is doing each day, including runs, double-ups, covers and one-offs, with today's status on each block.",
    src: "/rostering/carer-timetable.png",
    more: "#rota",
  },
  {
    id: "clients",
    label: "Clients",
    icon: Users,
    title: "Every client's week, in order",
    caption: "Morning to bed, the carer on each visit, and whether today's calls have started. Cancel a date, add a temporary visit or edit the pattern from here.",
    src: "/rostering/client-timetable.png",
    more: "#rota",
  },
  {
    id: "today",
    label: "Today",
    icon: Activity,
    title: "Know how today is going",
    caption: "The client list shows cover, assignment, hours a week, and for each call whether it is not started, late or done.",
    src: "/rostering/clients-list.png",
    more: "#monitoring",
  },
  {
    id: "oversight",
    label: "Oversight",
    icon: ClipboardList,
    title: "The whole service on one page",
    caption: "Quality, delivery, client movement, recruitment, training and complaints, counted from the system every fortnight and split by region.",
    src: "/rostering/oversight.png",
    more: "#quality",
  },
  {
    id: "carer-app",
    label: "Carer app",
    icon: Smartphone,
    title: "Everything a carer needs, in one app",
    caption: "Clock in with GPS or QR, tasks, medication, notes and photos, messages and requests. A capture from the demo carer's phone is coming.",
    more: "#carer-app",
  },
  {
    id: "finance",
    label: "Finance",
    icon: PoundSterling,
    title: "Invoices and pay from what actually happened",
    caption: "Invoices, timesheets, payroll CSV and road mileage built from the roster and the clocked visits. Capture to follow.",
    more: "#finance",
  },
  {
    id: "care-homes",
    label: "Care homes",
    icon: Building2,
    title: "Residents, shifts and package invoicing",
    caption: "Residents under their home with room, funding and weekly rate; shifts with seats; one council invoice per home. Capture to follow.",
    more: "#care-homes",
  },
];

export default function AppTour() {
  const [active, setActive] = useState(0);
  const stop = STOPS[active];
  const Icon = stop.icon;
  return (
    <div>
      <div className="rounded-[2rem] bg-white p-3 shadow-xl shadow-[#134f63]/10 ring-1 ring-[#134f63]/8">
        <div className="mca-frame">
          <div className="relative overflow-hidden rounded-[1.2rem] bg-white">
            {stop.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={stop.src} src={stop.src} alt={stop.title} className="block w-full animate-in fade-in duration-300" />
            ) : (
              <div className="flex aspect-[16/7] items-center justify-center px-6 text-center">
                <div>
                  <div className="font-display text-lg font-semibold text-[#134f63]">{stop.title}</div>
                  <div className="mt-1 text-sm text-[#0f2f3c]/55">Screenshot from the demo company to follow</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-start gap-4 px-4 pb-3 pt-4 sm:px-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6fa] text-[#1d6f8a]">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-semibold">{stop.title}</div>
            <p className="mt-0.5 text-sm text-[#0f2f3c]/65">{stop.caption}</p>
          </div>
          {stop.more && (
            <a href={stop.more} className="shrink-0 self-center text-sm font-semibold text-[#134f63] hover:underline">
              Read more ↓
            </a>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Tour of the product">
        {STOPS.map((s, i) => {
          const I = s.icon;
          const on = i === active;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(i)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 transition ${
                on
                  ? "bg-[#134f63] text-white ring-[#134f63]"
                  : "bg-white text-[#134f63] ring-[#134f63]/10 hover:-translate-y-0.5 hover:shadow-md"
              }`}
            >
              <I className={`size-4 ${on ? "text-white" : "text-[#3a9fc4]"}`} />
              {s.label}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-[#0f2f3c]/50">Real pages from our demo company. Names are fictional.</p>
    </div>
  );
}
