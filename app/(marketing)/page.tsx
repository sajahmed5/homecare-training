import Link from "next/link";
import { ArrowRight, CalendarDays, GraduationCap, HeartHandshake, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { Arrow, CtaBand, Eyebrow, H2, Hero, PillLink, Section, ShotFrame, Stat } from "./ui";

// Home: a front door to the two products (Saj, 9 Sept 2026: "2 main separate
// pages. one for rostering, one for training").
export default function Home() {
  return (
    <>
      <Hero
        eyebrow={<>Built by people who ran care</>}
        title={
          <>
            Training and rostering
            <br />
            for care providers
          </>
        }
        body="Two things every care service needs, from one company that has run one: a rostering system that understands care, and training that lands straight in your carers' records."
        trust={[
          { icon: HeartHandshake, label: "Founded by a care provider" },
          { icon: Sparkles, label: "Everything included, no modules" },
          { icon: ShieldCheck, label: "UK-based, CQC-ready records" },
        ]}
      >
        <PillLink href="/rostering" tone="white">
          Explore Rostering <Arrow />
        </PillLink>
        <PillLink href="/training" tone="outline-white">
          Explore Training <Arrow />
        </PillLink>
      </Hero>

      <Section className="-mt-10 pt-0 sm:-mt-14">
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/rostering"
            className="group rounded-[2rem] bg-white p-3 shadow-xl shadow-[#134f63]/10 ring-1 ring-[#134f63]/8 transition hover:-translate-y-1"
          >
            <ShotFrame label="A carer's weekly timetable" />
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
                See the rostering system
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
                  ["Safeguarding adults", "Passed · 92%"],
                  ["Medication awareness", "Passed · 88%"],
                  ["Moving and handling", "In progress"],
                ].map(([course, state]) => (
                  <div
                    key={course}
                    className="flex items-center justify-between rounded-xl bg-[#f6fafc] px-4 py-3 ring-1 ring-[#134f63]/8"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <GraduationCap className="size-4 text-[#3a9fc4]" />
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
              <div className="flex items-center gap-2 text-sm font-semibold text-[#1d6f8a]">
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
                See the training
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </div>
      </Section>

      <Section className="pt-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Why My Care Academy</Eyebrow>
          <H2 className="mt-4">Made from inside a care office, not a software office</H2>
          <p className="mt-4 text-lg text-[#0f2f3c]/65">
            Most care software and training is made by people who have never
            run a care service. Ours started as the problems on one manager&apos;s desk.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: HeartHandshake,
              title: "Built by care providers",
              body: "Our founder ran a domiciliary care company for more than ten years. Every screen and every course started as a problem in that office.",
            },
            {
              icon: Layers,
              title: "Training feeds the rota",
              body: "Certificates from Training land in a carer's record in Rostering. Overdue training shows on the Oversight page. One login, one company.",
            },
            {
              icon: Sparkles,
              title: "Everything included",
              body: "No modules, no per-feature fees, unlimited carers and office users. Support from people who have done the job.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-[2rem] bg-[#eef6fa] p-8">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#1d6f8a] shadow-sm">
                <Icon className="size-5" />
              </div>
              <h3 className="font-display mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-[#0f2f3c]/65">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="sand">
        <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
          <blockquote>
            <p className="font-display text-2xl font-medium leading-snug text-[#134f63] sm:text-3xl">
              &ldquo;We did not build features. We fixed the things that kept
              us up at night: the missed visit nobody knew about, the invoice
              that did not match the rota, the carer whose training had
              lapsed.&rdquo;
            </p>
            <footer className="mt-6 text-sm text-[#0f2f3c]/65">
              Founder, My Care Academy · ran a home care company for over ten
              years
            </footer>
          </blockquote>
          <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
            <Stat n="10+" label="years running a care company" />
            <Stat n="26" label="CQC-aligned courses" />
            <Stat n="1" label="system for office, carers and families" />
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
