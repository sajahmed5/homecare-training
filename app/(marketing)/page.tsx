import Link from "next/link";
import { ArrowRight, CalendarDays, GraduationCap, ShieldCheck } from "lucide-react";
import { Arrow, CtaBand, H2, PillLink, Section } from "./ui";

// Home: two worlds side by side (Saj, 9 Sept 2026: "every page looks the
// same… we want to show creativity"). Rostering lives in the dark ops room,
// Training in warm daylight; the headline cycles through who built this.
const TICKER = [
  "Built inside a care office, not a software office",
  "Alerts the moment a visit is late",
  "Invoices from what actually happened",
  "26 CQC-aligned courses",
  "Certificates anyone can verify",
  "Unlimited carers, office users and learners",
  "Home care and care homes in one system",
  "Training that lands in the rota",
];

// Milestones are relative on purpose — Saj to confirm the years.
const STORY: [string, string][] = [
  ["Ten years ago", "Our founder opens a domiciliary care company in Stockport."],
  ["Along the way", "Hundreds of clients across several regions. Three systems, five logins, one spreadsheet for money."],
  ["Then", "My Care Academy starts: training written for UK adult social care, not adapted from corporate e-learning."],
  ["Last year", "We stop waiting for a rostering system that understands care and start building one from inside the office."],
  ["Today", "Rostering runs our own service. Training and Rostering are one company with two products."],
];

export default function Home() {
  return (
    <>
      {/* Split hero */}
      <section className="-mt-24 grid min-h-[92vh] grid-cols-1 md:grid-cols-2">
        <div className="mca-night mca-grid relative flex flex-col justify-end px-6 pb-14 pt-36 sm:px-12 sm:pb-20">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8fd3ea]">
            <CalendarDays className="size-4" /> Rostering
          </div>
          <h1 className="font-display mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl">
            Rostering built by people who{" "}
            <span className="mca-swap text-[#8fd3ea]">
              <span>ran care.</span>
              <span>did the visits.</span>
              <span>chased the invoices.</span>
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-white/75">
            One system for the office, the carers and the families. Rota, live
            monitoring, care records, finance and oversight. Everything included.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink href="/rostering" tone="white">
              See the system <Arrow />
            </PillLink>
            <PillLink href="/rostering/pricing" tone="outline-white">
              Pricing
            </PillLink>
          </div>
        </div>
        <div className="mca-day relative flex flex-col justify-end px-6 pb-14 pt-36 sm:px-12 sm:pb-20">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#b7791f]">
            <GraduationCap className="size-4" /> Training
          </div>
          <h2 className="font-display mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-[#2b1d0e] sm:text-6xl">
            Training your carers finish on their phones, and inspectors believe.
          </h2>
          <p className="mt-5 max-w-md text-lg text-[#2b1d0e]/70">
            26 CQC-aligned courses, certificates anyone can verify, mock
            inspections, and hands-on help running a well-led service.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink href="/training" tone="dark">
              See the training <Arrow />
            </PillLink>
            <PillLink href="/training/pricing" tone="ghost">
              Pricing
            </PillLink>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="overflow-hidden border-y border-[#134f63]/10 bg-white py-3">
        <div className="mca-marquee gap-10 text-sm font-medium text-[#134f63]">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-[#3a9fc4]" />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Why: one big statement, not three identical cards */}
      <Section className="pt-10">
        <div className="grid items-start gap-10 md:grid-cols-[1.1fr_1fr]">
          <H2 className="text-4xl sm:text-5xl">
            Most care software is made by people who have never run a care
            service. Ours started as the problems on one manager&apos;s desk.
          </H2>
          <ol className="relative border-l border-[#134f63]/15 pl-6">
            {STORY.map(([year, text]) => (
              <li key={year} className="relative pb-7 last:pb-0">
                <span className="absolute -left-[31px] top-1 flex size-3 items-center justify-center rounded-full bg-[#3a9fc4] ring-4 ring-white" />
                <div className="font-display text-sm font-semibold text-[#1d6f8a]">{year}</div>
                <p className="mt-1 text-[#0f2f3c]/75">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* Together: the one thing only we can say */}
      <Section tone="deep">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8fd3ea]">
              <ShieldCheck className="size-4" /> Together
            </div>
            <H2 className="mt-4 text-white">Training that lands in the rota</H2>
            <p className="mt-4 text-white/75">
              A carer passes Safeguarding on her phone at 9pm. By 9:01 the
              certificate is in her record in Rostering, the Oversight page
              counts it, and the roster stops flagging her. One company, one
              login, no re-typing.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              ["21:00", "Safeguarding adults passed, 92%", "Training"],
              ["21:01", "Certificate filed on the carer's record", "Rostering"],
              ["21:01", "Overdue training count drops by one", "Oversight"],
              ["Mon 08:00", "Rostered with no training flag", "Timetable"],
            ].map(([t, what, where]) => (
              <div key={t + what} className="flex items-center gap-4 rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                <span className="w-20 shrink-0 font-mono text-xs text-[#8fd3ea]">{t}</span>
                <span className="flex-1 text-sm text-white">{what}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">{where}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Two doors */}
      <Section className="pt-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/rostering" className="group mca-night rounded-[2rem] p-8 text-white transition hover:-translate-y-1">
            <CalendarDays className="size-6 text-[#8fd3ea]" />
            <h3 className="font-display mt-4 text-2xl font-semibold">Rostering</h3>
            <p className="mt-2 text-white/70">Click through the real product, no demo needed.</p>
            <span className="mt-5 inline-flex items-center gap-1 font-semibold text-[#8fd3ea]">
              Take the tour <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
          <Link href="/training" className="group mca-day rounded-[2rem] p-8 ring-1 ring-[#b7791f]/15 transition hover:-translate-y-1">
            <GraduationCap className="size-6 text-[#b7791f]" />
            <h3 className="font-display mt-4 text-2xl font-semibold text-[#2b1d0e]">Training</h3>
            <p className="mt-2 text-[#2b1d0e]/70">Courses, mock inspections and management support.</p>
            <span className="mt-5 inline-flex items-center gap-1 font-semibold text-[#b7791f]">
              See what&apos;s covered <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </Section>

      <CtaBand
        title="Not sure where to start?"
        body="Tell us about your service and we will talk through what would help most: the rostering system, the training, a mock inspection, or all three."
      />
    </>
  );
}
