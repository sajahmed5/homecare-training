import type { Metadata } from "next";
import Image from "next/image";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Rostering software — My Care Academy",
  description:
    "My Care Academy Rostering: rota, carer app, live call monitoring, care records, finance and oversight in one system for home care agencies and care homes. Built by people who ran a care company.",
};

// The screenshots are staged with fictional names (see the marketing pack in
// OneDrive → HG Care Folder → My Care Academy → Marketing - Rostering); real
// screens show real clients and carers, so they are never used here.
const FEATURES: {
  id: string;
  title: string;
  intro: string;
  points: string[];
  image: { src: string; alt: string; width: number; height: number };
}[] = [
  {
    id: "rostering",
    title: "A rota that understands double-ups, cover, holds and runs",
    intro:
      "Visits, runs and care-home shifts on one weekly timetable, with the awkward cases handled properly instead of as workarounds.",
    points: [
      "Cover is decided per visit, not per client; a hold has a start and end time and cancels the right calls",
      "Care-home shifts that need a set number of carers, with each empty seat flagged",
      "Change twenty visits at once, see exactly what will change, confirm once",
      "Every amendment is dated, so the past is never rewritten",
    ],
    image: {
      src: "/rostering/timetable.png",
      alt: "Weekly timetable with runs, double-ups, cover and a care-home shift",
      width: 1600,
      height: 1000,
    },
  },
  {
    id: "carer-app",
    title: "One app for carers",
    intro:
      "Everything a carer needs in the app they already open: clock-in, tasks, medication, notes, messages and requests.",
    points: [
      "Clock in with GPS at the door, or a QR code where there is no signal",
      "Tasks from the care plan, medication with a time, repositioning with an optional photo",
      "Message the office or a care team, request leave or a swap, see the handover for a shift",
      "Push notifications for rota changes and messages, and rewards for reliability",
    ],
    image: {
      src: "/rostering/carer-app.png",
      alt: "The carer app during a visit: clocked in, tasks ticked, medication and a visit note",
      width: 700,
      height: 1145,
    },
  },
  {
    id: "monitoring",
    title: "Know the moment a visit is late",
    intro:
      "Not when the family rings. Alerts fire the moment a visit is late, missed, overstayed or repeatedly late, and each one becomes a to-do with an owner.",
    points: [
      "Late, missed, overstayed and repeatedly-late visits, clock-ins without GPS, carers over their hours",
      "Escalation to a named person, then to the on-call phone if nobody picks it up",
      "Actual time against scheduled time for every visit, carer and region",
      "A family portal that shows the visits, notes and photos you choose to share",
    ],
    image: {
      src: "/rostering/ecm.png",
      alt: "Live call monitoring with a late-visit alert and today's visits",
      width: 1600,
      height: 1000,
    },
  },
  {
    id: "finance",
    title: "Invoices and pay from what actually happened",
    intro:
      "Invoices, timesheets and a payroll CSV are built for any period from the roster and the clocked visits. Nothing is typed twice.",
    points: [
      "Regional pay rates, night windows, weekends and bank holidays applied automatically",
      "Mileage between visits calculated on real roads",
      "Frustrated cancellations charged under your notice rule; holds cost nothing",
      "An issued invoice is never rewritten: corrections become an adjustment on the next one",
    ],
    image: {
      src: "/rostering/finance.png",
      alt: "Finance page with invoices, timesheets and period totals",
      width: 1600,
      height: 1000,
    },
  },
  {
    id: "oversight",
    title: "The whole service on one page",
    intro:
      "Quality, delivery, client movement, recruitment, training and complaints, counted from the system every fortnight. Click any number to see who is behind it.",
    points: [
      "Supervisions, spot-checks, appraisals and QAs with due dates on every carer and client",
      "Complaints and safeguarding investigations that gather their own evidence from the visit records",
      "Risk assessments and care plans drafted by AI from the documents you already hold",
      "Reports as CSV or PDF, by region, following whatever filters are on screen",
    ],
    image: {
      src: "/rostering/oversight.png",
      alt: "Oversight page with fortnightly figures for quality, delivery, client movement and recruitment",
      width: 1600,
      height: 1000,
    },
  },
  {
    id: "care-homes",
    title: "Home care and care homes in the same system",
    intro:
      "Residents live under their home with room, funding and weekly rate. Shifts have seats. Councils get one invoice per home; private residents get their own.",
    points: [
      "Residents are never mixed into home-care lists or reports",
      "Day and night shifts with the number of carers each one needs",
      "Package invoicing pro-rated for hospital stays and arrivals",
      "Carers on a home shift see residents, medication and handover in the same app",
    ],
    image: {
      src: "/rostering/carehome.png",
      alt: "A care home's residents and this week's shifts",
      width: 1600,
      height: 1000,
    },
  },
];

const COMPARE: [string, string, string][] = [
  [
    "Rostering",
    "A rota with runs and recommendations for unassigned calls.",
    "Plus cover per visit, timed holds, care-home shifts with seats, bulk changes with one confirmation and a dated history.",
  ],
  [
    "Live monitoring",
    "Attendance, lateness and duration reported after the event.",
    "Alerted the moment a visit is late; escalates to on-call and becomes a to-do with an owner.",
  ],
  [
    "Carer app",
    "Clock in and out, tasks, medication and notes; messages by text or email.",
    "The same, plus in-app messaging, requests, handover, push notifications and rewards.",
  ],
  [
    "Finance",
    "Invoices and timesheets from confirmed appointments; exceptions by hand.",
    "Plus road mileage, cancellation rules and corrections that never rewrite an issued invoice.",
  ],
  [
    "Paperwork",
    "Care plans and checklists completed by hand.",
    "Drafted by AI from the documents you already hold; investigations gather their own evidence.",
  ],
  [
    "Oversight",
    "Dozens of separate reports, each run one at a time.",
    "One fortnightly page for the whole service, every number clickable.",
  ],
  [
    "Pricing",
    "Per module, per user, plus add-ons and implementation fees.",
    "Everything included. Unlimited carers, office users and family logins.",
  ],
];

export default function RosteringPage() {
  return (
    <>
      <section className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
        <span className="mb-6 inline-flex items-center rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
          My Care Academy Rostering · home care and care homes
        </span>
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Rostering built by people who ran care
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          One system for the office, the carers and the families: rota, live
          call monitoring, care records, finance and oversight. Every feature
          included, unlimited users.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:hello@mycareacademy.co.uk?subject=Rostering%20demo"
            className={buttonVariants({ size: "lg" })}
          >
            Book a demo
          </a>
          <a
            href="#features"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            See what it does
          </a>
        </div>
        <Image
          src="/rostering/dashboard.png"
          alt="The dashboard: cover gaps, double bookings, your actions, complaints, alerts and messages on one screen"
          width={1600}
          height={1000}
          priority
          className="mt-12 rounded-2xl border shadow-md"
        />
      </section>

      <section className="border-t bg-card/40">
        <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-16 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Most rostering systems are built by software developers. This one
              was built by a care provider.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every rostering system we tried had the same problem: the people
              who built it had never run a care company. Double-ups were a
              workaround, cover was a phone call, invoices were a spreadsheet,
              and when a visit was missed nobody found out until the family
              rang.
            </p>
            <p className="mt-3 text-muted-foreground">
              Our founder ran a domiciliary care company for more than ten
              years, with hundreds of clients and carers across several
              regions. This system was designed from inside that office, one
              problem at a time, and it is the system that company runs on
              today.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
            {[
              ["1", "system for the office, carers and families"],
              ["0", "add-on modules"],
              ["10+", "years running a care company"],
            ].map(([n, label]) => (
              <div
                key={label}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="text-3xl font-semibold text-primary">{n}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="features" className="scroll-mt-24">
        {FEATURES.map((f, i) => {
          const phone = f.id === "carer-app";
          return (
            <section
              key={f.id}
              id={f.id}
              className={`scroll-mt-24 ${i % 2 === 1 ? "bg-card/40" : ""} border-t`}
            >
              <div
                className={`mx-auto grid w-full max-w-5xl items-center gap-10 px-6 py-16 ${
                  phone ? "md:grid-cols-[1.3fr_0.7fr]" : "md:grid-cols-2"
                }`}
              >
                <div className={i % 2 === 1 && !phone ? "md:order-2" : ""}>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {f.title}
                  </h2>
                  <p className="mt-3 text-muted-foreground">{f.intro}</p>
                  <ul className="mt-5 space-y-3">
                    {f.points.map((p) => (
                      <li key={p} className="flex gap-3 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Image
                  src={f.image.src}
                  alt={f.image.alt}
                  width={f.image.width}
                  height={f.image.height}
                  className={
                    phone
                      ? "mx-auto w-full max-w-xs rounded-2xl"
                      : "rounded-2xl border shadow-md"
                  }
                />
              </div>
            </section>
          );
        })}
      </div>

      <section className="border-t bg-card/40">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Other rostering systems offer a rota. We offer the whole office.
            </h2>
            <p className="mt-3 text-muted-foreground">
              What established rostering systems typically provide, from our
              own years of running a care company on them, next to what this
              one does.
            </p>
          </div>
          <div className="mt-10 overflow-x-auto rounded-2xl border bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Area</th>
                  <th className="px-4 py-3 font-semibold">
                    Other rostering systems
                  </th>
                  <th className="px-4 py-3 font-semibold text-primary">
                    My Care Academy Rostering
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([area, them, us]) => (
                  <tr key={area} className="border-b last:border-0">
                    <td className="px-4 py-3 align-top font-semibold">
                      {area}
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {them}
                    </td>
                    <td className="bg-primary/5 px-4 py-3 align-top">{us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">
            See it on your own data
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            A 45-minute demo on your own numbers, then a 30-day trial with your
            real clients, carers and rotas imported. Everything included, no
            modules, no surprises.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:hello@mycareacademy.co.uk?subject=Rostering%20demo"
              className={buttonVariants({ size: "lg" })}
            >
              Book a demo
            </a>
            <a
              href="tel:+441616944701"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              0161 694 4701
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
