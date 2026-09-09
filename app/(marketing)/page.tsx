import Link from "next/link";
import { ArrowRight, CalendarDays, GraduationCap, ShieldCheck } from "lucide-react";
import CareDay from "./care-day";
import { Arrow, CtaBand, H2, PillLink, Section, ShotFrame } from "./ui";

// Home = idea C (editorial, the cycling headline) + idea B (the care day),
// combined at Saj's request on 9 Sept 2026. One palette throughout.
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
      {/* Editorial opener */}
      <section className="-mt-24 bg-[#f6fafc] px-4 pb-14 pt-36 sm:pt-44">
        <div className="mx-auto grid max-w-6xl items-stretch gap-10 md:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d6f8a]">
              My Care Academy · Stockport · est. 2002
            </div>
            <h1 className="font-display mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-[#0f2f3c] sm:text-6xl">
              Care software and training from people who{" "}
              <span className="mca-swap text-[#3a9fc4]">
                <span>never left the job.</span>
                <span>still do the visits.</span>
                <span>chased the invoices.</span>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#0f2f3c]/65">
              We started a home care company in 2002. Twenty-four years later we
              still run it, and we built the rostering system and the training
              we always wanted. Now you can have them too.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PillLink href="/rostering">
                Rostering <Arrow />
              </PillLink>
              <PillLink href="/training" tone="ghost">
                Training <Arrow />
              </PillLink>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[["2002", "the year we started in care"], ["24", "years running a care company"], ["0", "add-on modules, ever"]].map(([n, l]) => (
                <div key={n} className="border-t-2 border-[#134f63] pt-3">
                  <div className="font-display text-3xl font-semibold leading-none text-[#134f63] sm:text-4xl">{n}</div>
                  <div className="mt-1 text-xs text-[#0f2f3c]/60 sm:text-sm">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <blockquote className="mca-dusk flex flex-1 flex-col justify-between rounded-[1.5rem] p-6 text-white">
              <p className="font-display text-xl font-medium leading-snug sm:text-2xl">
                &ldquo;We did not build features. We fixed the things that kept
                us up at night.&rdquo;
              </p>
              <footer className="mt-6 text-xs text-[#8fd3ea]">Founder, My Care Academy</footer>
            </blockquote>
            <div className="mca-cert rounded-[1.25rem] p-5 ring-1 ring-[#b7791f]/30">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">Genuine</span>
                <ShieldCheck className="size-4 text-[#134f63]" />
              </div>
              <div className="font-display mt-3 text-lg font-semibold text-[#2b1d0e]">Safeguarding Adults Level 2</div>
              <div className="mt-1 text-xs text-[#2b1d0e]/60">
                Awarded to A. Yusuf · 92% · verify at mycareacademy.co.uk/verify ·{" "}
                <span className="font-mono">MCA-7K2Q-9F3D</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
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

      {/* The care day, made explicit */}
      <Section className="pt-10">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d6f8a]">A Tuesday at a care company</div>
          <H2 className="mt-3">Where the software steps in, hour by hour</H2>
          <p className="mt-3 text-[#0f2f3c]/65">
            One ordinary day, 06:00 to 22:00. Teal moments are Rostering, amber
            moments are Training. Click any one to see what actually happens.
          </p>
        </div>
        <div className="mt-8">
          <CareDay />
        </div>
      </Section>

      {/* Two doors */}
      <Section tone="soft">
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
              <h3 className="font-display mt-2 text-2xl font-semibold">
                One system for the office, the carers and the families
              </h3>
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
                        state.startsWith("Passed") ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
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
              <h3 className="font-display mt-2 text-2xl font-semibold">
                Mandatory training, mock inspections and management support
              </h3>
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

      <CtaBand
        title="Not sure where to start?"
        body="Tell us about your service and we will talk through what would help most: the rostering system, the training, a mock inspection, or all three."
      />
    </>
  );
}
