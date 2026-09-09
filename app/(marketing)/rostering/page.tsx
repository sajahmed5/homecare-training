import type { Metadata } from "next";
import { CalendarDays, Smartphone, Users } from "lucide-react";
import AppTour from "./app-tour";
import DayTimeline from "./day-timeline";
import {
  Arrow,
  CheckItem,
  CtaBand,
  Eyebrow,
  H2,
  PillLink,
  Section,
  ShotFrame,
  Stat,
} from "../ui";

export const metadata: Metadata = {
  title: "Rostering software — My Care Academy",
  description:
    "My Care Academy Rostering: rota, carer app, live call monitoring, care records, finance and oversight in one system for home care agencies and care homes. Built by people who ran a care company.",
};

// Screenshots are GENUINE pages from the portal, captured on TEST_ records
// only (Saj, 9 Sept 2026: "some of these images are not genuine… we don't
// have a page that looks like this"). Never staged, never real clients.
const SHOTS = {
  timetable: { label: "A carer's weekly timetable", src: "/rostering/carer-timetable.png" },
  client: { label: "A client's weekly visit schedule", src: "/rostering/client-timetable.png" },
  oversight: { label: "The Oversight page", src: "/rostering/oversight.png" },
  dashboard: { label: "The dashboard", src: "/rostering/dashboard.png" },
};


function Feature({
  id,
  eyebrow,
  title,
  intro,
  points,
  shot,
  flip,
  tone,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  points: [string, string][];
  shot?: { label: string; src?: string };
  flip?: boolean;
  tone?: "plain" | "soft" | "sand";
}) {
  return (
    <Section id={id} tone={tone} className="scroll-mt-28 pt-6">
      <div className={`grid items-center gap-10 ${shot ? "md:grid-cols-2" : "md:grid-cols-[1fr_1.1fr]"}`}>
        <div className={flip && shot ? "md:order-2" : ""}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <H2 className="mt-4">{title}</H2>
          <p className="mt-3 text-[#0f2f3c]/65">{intro}</p>
          <ul className="mt-6 space-y-4">
            {points.map(([t, d]) => (
              <CheckItem key={t} title={t}>
                {d}
              </CheckItem>
            ))}
          </ul>
        </div>
        {shot ? (
          <ShotFrame label={shot.label} src={shot.src} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {points.slice(0, 4).map(([t]) => (
              <div key={t} className="rounded-2xl bg-white p-5 text-sm font-semibold shadow-sm ring-1 ring-[#134f63]/8">
                {t}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

export default function RosteringPage() {
  return (
    <>
      {/* The product is the hero: dark ops room, the real thing front and centre. */}
      <section className="mca-dusk mca-grid -mt-24 px-4 pb-16 pt-32 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-end gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8fd3ea]">
                <CalendarDays className="size-4" /> My Care Academy Rostering
              </div>
              <h1 className="font-display mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl">
                Rostering built by people who{" "}
                <span className="mca-swap text-[#8fd3ea]">
                  <span>ran care.</span>
                  <span>did the visits.</span>
                  <span>chased the invoices.</span>
                </span>
              </h1>
            </div>
            <div>
              <p className="text-lg text-white/75">
                One system for the office, the carers and the families. Click
                around the real product below. No demo needed to see how it works.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <PillLink href="mailto:hello@mycareacademy.co.uk?subject=Rostering%20demo" tone="white">
                  Book a demo <Arrow />
                </PillLink>
                <PillLink href="/rostering/pricing" tone="outline-white">
                  See pricing
                </PillLink>
              </div>
            </div>
          </div>
          <div className="mt-12">
            <AppTour />
          </div>
        </div>
      </section>

      <section className="mca-dusk px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8fd3ea]">A day with the system</div>
            <H2 className="mt-3 text-white">What it does while the office works</H2>
            <p className="mt-3 text-white/70">Hover an hour. Every one of these is something the system does today, not a roadmap.</p>
          </div>
          <div className="mt-10">
            <DayTimeline />
          </div>
        </div>
      </section>

      <Section className="pt-6">
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <H2>
              Most rostering systems are built by software developers. This one
              was built by a care provider.
            </H2>
            <p className="mt-4 text-[#0f2f3c]/65">
              Every rostering system we tried had the same problem: the people
              who built it had never run a care company. Double-ups were a
              workaround, cover was a phone call, invoices were a spreadsheet,
              and when a visit was missed nobody found out until the family
              rang.
            </p>
            <p className="mt-3 text-[#0f2f3c]/65">
              Our founder started a domiciliary care company in 2002 and has
              run it for 24 years, with hundreds of clients and carers across
              several regions. This system was designed from inside that office, one
              problem at a time, and it is the system that company runs on
              today.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
            <Stat n="1" label="system for the office, carers and families" />
            <Stat n="0" label="add-on modules" />
            <Stat n="24" label="years running a care company, since 2002" />
          </div>
        </div>
      </Section>

      <Section tone="sand">
        <div className="mx-auto max-w-2xl text-center">
          <H2>Three apps in one system</H2>
          <p className="mt-4 text-[#0f2f3c]/65">
            Built as one, so it works as one. No re-typing between systems, no
            separate logins, no bolted-on modules.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: "The office portal",
              body: "Rota, clients, carers, care records, alerts, finance, complaints, oversight and reports. Everything the office does, in one place, on any computer.",
            },
            {
              icon: Smartphone,
              title: "The carer app",
              body: "Clock in with GPS or QR, tasks, medication, repositioning, notes and photos, messaging, requests and rewards. Works on the phone they already have.",
            },
            {
              icon: Users,
              title: "The family portal",
              body: "Relatives see the visits, notes and photos you choose to share, with visibility set per client. Fewer calls to the office, more trust.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-[#134f63]/8">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#eef6fa] text-[#1d6f8a]">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-[#0f2f3c]/65">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Feature
        id="rota"
        eyebrow="Rostering"
        title="A rota that understands double-ups, cover, holds and runs"
        intro="Visits, runs and care-home shifts on one weekly timetable, with the awkward cases handled properly instead of as workarounds."
        points={[
          ["Cover decided per visit, not per client", "A hold has a start and end time and cancels the right calls; a cover from 2pm spares the morning."],
          ["Care-home shifts with seats", "A shift that needs three carers shows each seat, and flags the empty one."],
          ["Change twenty visits at once", "See exactly what will change, confirm once. Every amendment is dated, so the past is never rewritten."],
          ["Gaps and clashes on the dashboard", "Unallocated visits and double bookings appear the moment they happen, with an auto-fix that suggests who can take them."],
        ]}
        shot={SHOTS.client}
        tone="soft"
      />

      <Feature
        id="carer-app"
        eyebrow="Carer app"
        title="Everything a carer needs, in the one app they already open"
        intro="Clock-in, tasks, medication, notes, messages and requests, on the phone in their pocket."
        points={[
          ["Clock in that proves the visit", "GPS at the door, or a QR code where there is no signal. Late and missed visits alert the office automatically."],
          ["Tasks, medication and repositioning", "Every task from the care plan, ticked or given a reason. Medication with a time. Repositioning charted with an optional photo."],
          ["Messaging, requests and handover", "Message the office or a care team, request leave or a swap, and see the handover notes for a shift."],
          ["Push notifications and rewards", "A rota change or a message reaches the phone, and reliability earns points the office can recognise."],
        ]}
        flip
      />

      <Feature
        id="monitoring"
        eyebrow="Live monitoring"
        title="Know the moment a visit is late. Not when the family rings."
        intro="Alerts fire the moment a visit is late, missed, overstayed or repeatedly late, and each one becomes a to-do with an owner."
        points={[
          ["Alerts that mean something", "Late, missed, overstayed and repeatedly-late visits, clock-ins without GPS, carers over their hours, each with a tolerance you set."],
          ["Escalation with an owner", "An alert becomes a to-do for a named person and escalates to the on-call phone if nobody picks it up."],
          ["Actual against scheduled", "Planned time against clocked time for every visit, carer and region, so short visits are spotted before they become a complaint."],
          ["The visit is the record", "Clock-in, tasks, medication, notes and photos are stored against the visit itself. Investigations, invoices and family updates read from the same source."],
        ]}
        shot={SHOTS.dashboard}
        tone="sand"
      />

      <Feature
        id="finance"
        eyebrow="Finance"
        title="Invoices and pay from what actually happened"
        intro="Invoices, timesheets and a payroll CSV are built for any period from the roster and the clocked visits. Nothing is typed twice."
        points={[
          ["Rates that match reality", "Regional pay rates, night windows, weekends and bank holidays, double-ups, and hand-picked rates for the exceptions."],
          ["Mileage by road", "Miles between visits calculated on real roads, not straight lines, and paid on the timesheet."],
          ["Cancellations and holds", "Frustrated cancellations charged under your notice rule; holds cost nothing; a client in hospital is not invoiced."],
          ["Corrections that hold up", "An issued invoice is never rewritten. A correction becomes an adjustment on the next document, with the audit trail to match."],
        ]}
        flip
        tone="soft"
      />

      <Feature
        id="quality"
        eyebrow="Quality and compliance"
        title="The paperwork drafts itself. The evidence collects itself."
        intro="Supervisions, spot-checks, appraisals and QAs with due dates. Investigations that gather their own evidence. Assessments drafted by AI from the documents you already hold."
        points={[
          ["Risk assessments and care plans", "Drafted by AI from the referral or the previous provider's file, with CQC tags flowing through and a PDF for the home."],
          ["Complaints and safeguarding", "An investigation pulls its own evidence from the visit records, takes the carer's statement remotely, and tracks actions and lessons learned."],
          ["Performance improvement plans", "Two to four week plans with weekly reviews, evidence pulled automatically, and the carer's right of reply."],
          ["Training that syncs", "Certificates from My Care Academy Training land in the carer's record. Due-but-not-completed is counted for you."],
        ]}
        shot={SHOTS.oversight}
      />

      <Feature
        id="care-homes"
        eyebrow="Care homes"
        title="Home care and care homes in the same system"
        intro="Residents live under their home with room, funding and weekly rate. Shifts have seats. Councils get one invoice per home; private residents get their own."
        points={[
          ["Residents, not clients", "Residents are filed under their home and never mixed into home-care lists or reports."],
          ["Shifts with seats", "Day and night shifts with the number of carers each one needs; the roster flags an empty seat."],
          ["Package invoicing", "One council invoice per home, private residents on their own, pro-rated for hospital stays and arrivals."],
          ["Same carer app", "Carers on a home shift see residents, medication and handover in the same app. Nothing new to learn."],
        ]}
        flip
        tone="sand"
      />

      <Section className="pt-6">
        <div className="mx-auto max-w-2xl text-center">
          <H2>Other rostering systems offer a rota. We offer the whole office.</H2>
          <p className="mt-4 text-[#0f2f3c]/65">
            What established rostering systems typically provide, from our own
            years of running a care company on them, next to what this one
            does.
          </p>
        </div>
        <div className="mt-10 overflow-x-auto rounded-[2rem] bg-white shadow-sm ring-1 ring-[#134f63]/8">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#134f63]/10 text-xs uppercase tracking-wide text-[#0f2f3c]/55">
                <th className="px-5 py-4 font-semibold">Area</th>
                <th className="px-5 py-4 font-semibold">Other rostering systems</th>
                <th className="px-5 py-4 font-semibold text-[#1d6f8a]">My Care Academy Rostering</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Rostering", "A rota with runs and recommendations for unassigned calls.", "Plus cover per visit, timed holds, care-home shifts with seats, bulk changes with one confirmation and a dated history."],
                ["Live monitoring", "Attendance, lateness and duration reported after the event.", "Alerted the moment a visit is late; escalates to on-call and becomes a to-do with an owner."],
                ["Carer app", "Clock in and out, tasks, medication and notes; messages by text or email.", "The same, plus in-app messaging, requests, handover, push notifications and rewards."],
                ["Finance", "Invoices and timesheets from confirmed appointments; exceptions by hand.", "Plus road mileage, cancellation rules and corrections that never rewrite an issued invoice."],
                ["Paperwork", "Care plans and checklists completed by hand.", "Drafted by AI from the documents you already hold; investigations gather their own evidence."],
                ["Oversight", "Dozens of separate reports, each run one at a time.", "One fortnightly page for the whole service, every number clickable."],
                ["Pricing", "Per module, per user, plus add-ons and implementation fees.", "Everything included. Unlimited carers, office users and family logins."],
              ].map(([area, them, us]) => (
                <tr key={area} className="border-b border-[#134f63]/10 last:border-0">
                  <td className="px-5 py-4 align-top font-semibold">{area}</td>
                  <td className="px-5 py-4 align-top text-[#0f2f3c]/65">{them}</td>
                  <td className="bg-[#1d6f8a]/5 px-5 py-4 align-top">{us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <CtaBand
        title="See it on your own data"
        body="A 45-minute demo on your own numbers, then a 30-day trial with your real clients, carers and rotas imported. Everything included, no modules, no surprises."
      />
    </>
  );
}
