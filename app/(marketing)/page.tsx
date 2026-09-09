import Link from "next/link";
import { ArrowRight, CalendarDays, GraduationCap } from "lucide-react";
import { Arrow, CtaBand, H2, PillLink, Section, ShotFrame } from "./ui";

// Home: a calm front door in one palette (Saj, 9 Sept 2026: the split screen
// was "too crazy and very overwhelming… lets not have 2 very different
// contrasting colours next to one another"). Interim version — three fuller
// landing ideas are in the design canvas for Saj to choose from.
const FACTS = [
  "Founded by a care provider in 2002",
  "24 years running a care company",
  "Alerts the moment a visit is late",
  "Invoices from what actually happened",
  "26 CQC-aligned courses",
  "Certificates anyone can verify",
  "Unlimited carers, office users and learners",
  "Home care and care homes in one system",
];

export default function Home() {
  return (
    <>
      <section className="-mt-24 bg-[#f6fafc] px-4 pb-16 pt-36 sm:pb-20 sm:pt-44">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d6f8a]">My Care Academy</div>
          <h1 className="font-display mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-[#0f2f3c] sm:text-6xl">
            Training and rostering for care providers, from people who have run
            care since 2002
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-[#0f2f3c]/65">
            Two things every care service needs, from one company that has run
            one for 24 years: a rostering system that understands care, and
            training that lands straight in your carers&apos; records.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <PillLink href="/rostering">
              Explore Rostering <Arrow />
            </PillLink>
            <PillLink href="/training" tone="ghost">
              Explore Training <Arrow />
            </PillLink>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-[#134f63]/10 bg-white py-3">
        <div className="mca-marquee gap-10 text-sm font-medium text-[#134f63]">
          {[...FACTS, ...FACTS].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-[#3a9fc4]" />
              {t}
            </span>
          ))}
        </div>
      </div>

      <Section className="pt-10">
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/rostering"
            className="group rounded-[2rem] bg-white p-3 shadow-xl shadow-[#134f63]/10 ring-1 ring-[#134f63]/8 transition hover:-translate-y-1"
          >
            <ShotFrame label="A carer's weekly timetable" src="/rostering/carer-timetable.png" />
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1d6f8a]">
                <CalendarDays className="size-4" /> My Care Academy Rostering
              </div>
              <h2 className="font-display mt-2 text-2xl font-semibold">
                One system for the office, the carers and the families
              </h2>
              <p className="mt-2 text-[#0f2f3c]/65">
                Rota, live call monitoring, care records, finance and
                oversight. Home care and care homes. Everything included.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 font-semibold text-[#134f63]">
                Take the tour
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>

          <Link
            href="/training"
            className="group rounded-[2rem] bg-white p-3 shadow-xl shadow-[#134f63]/10 ring-1 ring-[#134f63]/8 transition hover:-translate-y-1"
          >
            <ShotFrame label="Training">
              <div className="grid w-full max-w-sm gap-3 px-6">
                {[
                  ["Safeguarding Adults Level 2", "Passed · 92%"],
                  ["Medication Awareness", "Passed · 88%"],
                  ["Moving and Handling", "In progress"],
                ].map(([course, state]) => (
                  <div
                    key={course}
                    className="flex items-center justify-between rounded-xl bg-[#fff8ee] px-4 py-3 ring-1 ring-[#b7791f]/15"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <GraduationCap className="size-4 text-[#b7791f]" />
                      {course}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        state.startsWith("Passed")
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {state}
                    </span>
                  </div>
                ))}
              </div>
            </ShotFrame>
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#b7791f]">
                <GraduationCap className="size-4" /> My Care Academy Training
              </div>
              <h2 className="font-display mt-2 text-2xl font-semibold">
                Mandatory training, mock inspections and management support
              </h2>
              <p className="mt-2 text-[#0f2f3c]/65">
                26 CQC-aligned courses with verifiable certificates, mock CQC
                inspections, and hands-on help running a well-led service.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 font-semibold text-[#134f63]">
                See what&apos;s covered
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </div>
      </Section>

      <Section tone="soft">
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <H2>Made from inside a care office, not a software office</H2>
            <p className="mt-4 text-[#0f2f3c]/70">
              Our founder started a domiciliary care company in 2002 and still
              runs it today. Every screen in Rostering and every course in
              Training began as a problem on that office&apos;s desk: the missed
              visit nobody knew about, the invoice that did not match the rota,
              the carer whose training had lapsed.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[["2002", "founded"], ["24", "years in care"], ["1", "login for both"]].map(([n, l]) => (
              <div key={l} className="rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-[#134f63]/8">
                <div className="font-display text-3xl font-semibold text-[#1d6f8a]">{n}</div>
                <div className="mt-1 text-xs text-[#0f2f3c]/60">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand
        title="Not sure where to start?"
        body="Tell us about your service and we will talk through what would help most: the rostering system, the training, a mock inspection, or all three."
      />
    </>
  );
}
