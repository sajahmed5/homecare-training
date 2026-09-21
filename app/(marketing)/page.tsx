import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Logo } from "@/components/logo";
import CareDay from "./care-day";
import { Arrow, CtaBand, H2, PillLink, Section } from "./ui";

// Home page redesign (Saj, 21 Sept 2026), from the mock-up he approved:
// real product on a desktop screen, the two systems side by side in their own
// colours (teal = Rostering, amber = Training), the care day kept.
//
// Every claim here is true of the products today. No client logos or
// customer quotes until there are real ones to show.
const COURSES = 26;

const TRUST = [
  ["2002", "the year we started in care"],
  [String(COURSES), "CQC-aligned care courses"],
  ["Unlimited", "carers, office users and learners"],
  ["0", "add-on modules to buy later"],
];

/** A desktop monitor with a browser bar — the product pictures sit in these. */
function Monitor({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mca-bezel">
        <div className="mca-chrome" aria-hidden>
          <i /><i /><i />
          <span>{label}</span>
        </div>
        <div className="overflow-hidden rounded-b bg-white">{children}</div>
      </div>
      <div className="mca-neck" aria-hidden />
      <div className="mca-foot" aria-hidden />
    </div>
  );
}

function Shot({ src, alt }: { src: string; alt: string }) {
  // Genuine capture from the demo company (fictional people), never a mock.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="block w-full" />;
}

function Ticks({ items, tone }: { items: string[]; tone: "teal" | "amber" }) {
  return (
    <ul className="grid gap-2 text-[15px]">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5">
          <span className={tone === "teal" ? "font-bold text-[#8fd3ea]" : "font-bold text-[#b7791f]"}>✓</span>
          {t}
        </li>
      ))}
    </ul>
  );
}

const ROTA = [
  ["S. Khan", ["07–14", "07–14", "", "14–22", "14–22"]],
  ["J. Miller", ["08–16", "", "08–16", "08–16", "07–14"]],
  ["P. Patel", ["14–22", "14–22", "open", "", "08–16"]],
] as const;

function shiftClass(s: string) {
  if (!s) return "bg-white/10";
  if (s === "open") return "bg-[#f4b4ad]";
  if (s.startsWith("07")) return "bg-[#8fd3ea]";
  if (s.startsWith("14")) return "bg-[#b7e4c7]";
  return "bg-[#c7c3f5]";
}

const PROGRESS = [
  ["Safeguarding Adults L2", 100],
  ["Medication Awareness", 75],
  ["Moving & Handling", 100],
  ["Infection Prevention", 30],
] as const;

const LIBRARY = [
  ["Safeguarding Adults L2", "mca-art-1"],
  ["Medication Awareness", "mca-art-2"],
  ["Person-Centred Care", "mca-art-3"],
  ["Infection Prevention", "mca-art-4"],
  ["Basic Life Support", "mca-art-5"],
  ["Fire Safety", "mca-art-6"],
] as const;

function Point({ tag, title, children, tone = "teal" }: { tag: string; title: string; children: React.ReactNode; tone?: "teal" | "amber" }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] items-baseline gap-3">
      <span className={`font-mono text-xs ${tone === "teal" ? "text-[#1d6f8a]" : "text-[#8a4d0c]"}`}>{tag}</span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-[#0f2f3c]/65">{children}</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mca-home-hero relative -mt-24 overflow-hidden px-4 pb-16 pt-36 sm:pt-44">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.02fr_1fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d6f8a]">
              Care software · Stockport · since 2002
            </div>
            <h1 className="font-display mt-4 text-balance text-4xl font-bold leading-[1.02] tracking-tight text-[#0f2f3c] sm:text-6xl">
              Rostering and training, built by people who{" "}
              <span className="bg-gradient-to-r from-[#1d6f8a] to-[#3a9fc4] bg-clip-text text-transparent">
                still do the visits.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#0f2f3c]/65">
              Two systems made by a home care company for care providers. Use
              either one on its own, or run them together so your rota and your
              compliance finally talk to each other.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PillLink href="mailto:hello@mycareacademy.co.uk?subject=Demo%20request">
                Book a demo <Arrow />
              </PillLink>
              <PillLink href="#systems" tone="ghost">
                Explore the two systems
              </PillLink>
            </div>
            <p className="mca-hand mt-5 inline-block -rotate-2">↳ no add-on modules. Ever.</p>
          </div>

          <div className="relative mx-3 mb-6 lg:mx-0">
            <div className="lg:[transform:perspective(1600px)_rotateY(-7deg)]">
              <Monitor label="Rostering · carer timetable">
                <Shot src="/rostering/carer-timetable.png" alt="A carer's weekly timetable in My Care Academy Rostering" />
              </Monitor>
            </div>
            <div className="mca-float absolute -left-3 -top-5 flex max-w-[15rem] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl shadow-[#0f2f3c]/15 ring-1 ring-[#134f63]/10 sm:-left-7 sm:top-[18%]">
              <span className="size-2.5 shrink-0 rounded-full bg-[#c2413a] ring-4 ring-[#c2413a]/15" />
              <span>
                <span className="block text-[13px] font-semibold">Arthur&apos;s 08:00 visit hasn&apos;t started</span>
                <span className="block text-xs text-[#0f2f3c]/60">22 min late · cover sent</span>
              </span>
            </div>
            <div className="mca-float mca-float-late mca-cert absolute -right-2 hidden w-56 rounded-2xl sm:block border-t-4 border-[#b7791f] p-4 shadow-xl shadow-[#0f2f3c]/15 ring-1 ring-[#b7791f]/20 sm:bottom-10 sm:-right-5 sm:w-64">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">✓ Verified certificate</span>
                <ShieldCheck className="size-4 text-[#134f63]" />
              </div>
              <div className="font-display mt-2.5 font-semibold leading-tight text-[#2b1d0e]">Safeguarding Adults Level 2</div>
              <div className="mt-1 text-xs text-[#2b1d0e]/60">Passed 92% · anyone can check it at mycareacademy.co.uk/verify</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip — real facts, not borrowed logos */}
      <div className="border-y border-[#134f63]/10 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 px-4 lg:grid-cols-4">
          {TRUST.map(([n, l], k) => (
            <div key={l} className={`py-5 pr-4 ${k % 2 ? "pl-4 sm:pl-6" : ""} ${k > 1 ? "border-t border-[#134f63]/10 lg:border-t-0" : ""} ${k > 0 ? "lg:border-l lg:border-[#134f63]/10 lg:pl-6" : ""}`}>
              <div className="font-display text-3xl font-bold leading-none text-[#134f63]">{n}</div>
              <div className="mt-1.5 text-sm text-[#0f2f3c]/60">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two systems */}
      <Section id="systems">
        <div className="grid items-end gap-6 md:grid-cols-[1.1fr_1fr]">
          <H2>Two systems. Your choice.</H2>
          <p className="text-lg text-[#0f2f3c]/65">
            Start with the one that hurts most. Add the other when you&apos;re
            ready — your staff, records and certificates carry straight across.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="mca-dusk grid gap-5 rounded-[1.75rem] p-7 sm:p-8">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
              <span className="grid size-7 place-items-center rounded-lg bg-white/15"><CalendarDays className="size-4" /></span>
              Rostering
            </span>
            <h3 className="font-display text-3xl font-semibold leading-tight text-white">
              Your rota, your visits and your office, in one place.
            </h3>
            <Ticks
              tone="teal"
              items={[
                "Build the week's rota in minutes, not an afternoon",
                "Alerts the moment a visit is late or missed",
                "Care plans, notes and photos from the carer's phone",
                "Invoices from what actually happened",
              ]}
            />
            <div className="self-end rounded-2xl border border-white/15 bg-white/10 p-3.5 text-xs" aria-hidden>
              <div className="grid grid-cols-[4.5rem_repeat(5,1fr)] gap-1.5 text-white/60">
                <span />{["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => <span key={d}>{d}</span>)}
              </div>
              {ROTA.map(([name, shifts]) => (
                <div key={name} className="mt-1.5 grid grid-cols-[4.5rem_repeat(5,1fr)] items-center gap-1.5">
                  <span>{name}</span>
                  {shifts.map((s, k) => (
                    <span key={k} className={`grid h-6 place-items-center rounded-md font-mono text-[10px] text-[#0b2a38] ${shiftClass(s)}`}>{s}</span>
                  ))}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <PillLink href="/rostering" tone="white">Explore Rostering <Arrow /></PillLink>
              <span className="text-sm text-white/75">Home care and care homes</span>
            </div>
          </article>

          <article className="mca-day grid gap-5 rounded-[1.75rem] p-7 sm:p-8">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a4d0c]">
              <span className="grid size-7 place-items-center rounded-lg bg-[#b7791f]/15"><GraduationCap className="size-4" /></span>
              Training
            </span>
            <h3 className="font-display text-3xl font-semibold leading-tight">
              Training your carers actually finish, on their phones.
            </h3>
            <Ticks
              tone="amber"
              items={[
                `${COURSES} CQC-aligned care courses, from Safeguarding to Sepsis`,
                "Reminders go out for you — one email, not sixteen",
                "Certificates anyone can verify online",
                "Mock CQC inspections and management support",
              ]}
            />
            <div className="self-end rounded-2xl bg-white p-3.5 shadow-lg shadow-[#8a4d0c]/15" aria-hidden>
              {PROGRESS.map(([course, pc], k) => (
                <div key={course} className={`grid grid-cols-[1fr_4rem_2.5rem] items-center gap-3 px-1 py-2 text-[13px] ${k ? "border-t border-[#f1e7da]" : ""}`}>
                  <span>{course}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-[#f3e7d6]"><span className="block h-full rounded-full bg-[#c9761a]" style={{ width: `${pc}%` }} /></span>
                  <span className="text-right font-mono text-[11px] text-[#8a6a44]">{pc}%</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/training" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#b7791f] px-5 text-sm font-semibold text-white transition hover:bg-[#8a4d0c]">
                Explore Training <ArrowRight className="size-4" />
              </Link>
              <span className="text-sm text-[#2b1d0e]/70">Works on any phone</span>
            </div>
          </article>
        </div>

        {/* Better together */}
        <div className="mt-6 grid items-center gap-8 rounded-[1.75rem] bg-white p-6 ring-1 ring-[#134f63]/10 sm:p-8 md:grid-cols-[1.3fr_1fr]">
          <div className="flex items-center gap-2 sm:gap-3" aria-hidden>
            <div className="shrink-0 text-center text-xs font-semibold sm:text-sm">
              <span className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-[#e4f2f6] text-[#1d6f8a] sm:size-16"><CalendarDays className="size-6" /></span>
              Rostering
            </div>
            <div className="mca-wire relative h-0.5 flex-1"><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[11px] text-[#0f2f3c]/55 sm:block">staff &amp; visits</span></div>
            <div className="shrink-0 text-center text-xs font-semibold sm:text-sm">
              <span className="mx-auto mb-2 grid size-16 place-items-center rounded-full bg-white shadow-lg shadow-[#134f63]/20 ring-8 ring-[#e4f2f6] sm:size-20"><Logo width={52} /></span>
              <span className="hidden sm:inline">My Care Academy</span>
            </div>
            <div className="mca-wire relative h-0.5 flex-1"><span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[11px] text-[#0f2f3c]/55 sm:block">certificates</span></div>
            <div className="shrink-0 text-center text-xs font-semibold sm:text-sm">
              <span className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-[#fcefdc] text-[#b7791f] sm:size-16"><GraduationCap className="size-6" /></span>
              Training
            </div>
          </div>
          <div>
            <h3 className="font-display text-2xl font-semibold">Better together.</h3>
            <p className="mt-2 text-[#0f2f3c]/65">
              Run both and each carer&apos;s training record sits alongside their
              rota, so the office can see who&apos;s up to date before anyone is
              sent out.
            </p>
          </div>
        </div>
      </Section>

      {/* Product up close */}
      <Section className="pt-0">
        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_1fr]">
          <div className="relative">
            <div className="absolute inset-[10%_-6%_-8%_12%] -z-10 rounded-[40%_60%_55%_45%] bg-[#e4f2f6]" aria-hidden />
            <Monitor label="Rostering · dashboard">
              <Shot src="/rostering/dashboard.png" alt="The Rostering dashboard: cover mismatches, double bookings and actions" />
            </Monitor>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d6f8a]">Rostering</div>
            <H2 className="mt-3">Open the dashboard and see what needs you.</H2>
            <p className="mt-3 text-lg text-[#0f2f3c]/65">
              Not a wall of charts. The short list of things going wrong today,
              each one with an owner.
            </p>
            <div className="mt-6 grid gap-4">
              <Point tag="08:22" title="A call hasn't started">The office is alerted and cover is sent for that one visit.</Point>
              <Point tag="12:30" title="Two carers, one visit">Both seats filled, both clocked in, and the invoice knows it.</Point>
              <Point tag="17:10" title="A client goes into hospital">Tonight&apos;s call is cancelled and the invoice stops from tomorrow.</Point>
            </div>
            <Link href="/rostering" className="mt-6 inline-flex items-center gap-1 border-b-2 border-current font-semibold text-[#1d6f8a]">
              Take the tour <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="mt-24 grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div className="lg:order-2 relative">
            <div className="absolute inset-[10%_-6%_-8%_12%] -z-10 rounded-[40%_60%_55%_45%] bg-[#fcefdc]" aria-hidden />
            <Monitor label="Training · course library">
              <div className="p-4 sm:p-5" aria-label="Example of the course library">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="font-display font-semibold">Course library</span>
                  <span className="max-w-[12rem] flex-1 rounded-full border border-[#134f63]/15 px-3 py-1 text-xs text-[#0f2f3c]/45">Search courses…</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {LIBRARY.map(([title, art]) => (
                    <div key={title} className="overflow-hidden rounded-xl ring-1 ring-[#134f63]/10">
                      <div className={`h-16 ${art}`} />
                      <div className="p-2.5 text-xs font-semibold leading-snug">{title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Monitor>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a4d0c]">Training</div>
            <H2 className="mt-3">Training your team can keep up with.</H2>
            <p className="mt-3 text-lg text-[#0f2f3c]/65">
              Short, mobile-first courses written for care work, with the
              paperwork done for you.
            </p>
            <div className="mt-6 grid gap-4">
              <Point tone="amber" tag="Assign" title="One click, the whole team">Pick a course, pick who, set a due date.</Point>
              <Point tone="amber" tag="Chase" title="Reminders that don't nag">One email per carer listing everything outstanding.</Point>
              <Point tone="amber" tag="Prove" title="Ready for CQC">Every certificate has a number an inspector can check.</Point>
            </div>
            <Link href="/training" className="mt-6 inline-flex items-center gap-1 border-b-2 border-current font-semibold text-[#8a4d0c]">
              See what&apos;s covered <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* The care day */}
      <Section tone="soft">
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

      {/* Benefits */}
      <Section>
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d6f8a]">Everything you need. Nothing you don&apos;t.</div>
        <div className="mt-4 grid border-t border-[#134f63]/10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Clock, "Save time", "Less admin, fewer spreadsheets, no chasing certificates by WhatsApp.", "teal"],
            [ShieldCheck, "Stay compliant", "Training and records organised the way an inspector asks.", "amber"],
            [Users, "Support your team", "Simple tools on the phone they already carry.", "teal"],
            [HeartHandshake, "Deliver better care", "Less time managing systems, more time with people.", "teal"],
          ].map(([Icon, title, body, tone], k) => {
            const I = Icon as typeof Clock;
            return (
              <div key={title as string} className={`pt-7 pr-6 ${k > 0 ? "lg:border-l lg:border-[#134f63]/10 lg:pl-6" : ""}`}>
                <span className={`mb-4 grid size-12 place-items-center rounded-2xl ${tone === "amber" ? "bg-[#fcefdc] text-[#b7791f]" : "bg-[#e4f2f6] text-[#1d6f8a]"}`}><I className="size-5" /></span>
                <h3 className="font-display text-lg font-semibold">{title as string}</h3>
                <p className="mt-1 text-sm text-[#0f2f3c]/65">{body as string}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Founder */}
      <Section className="pt-0">
        <div className="grid items-center gap-10 rounded-[2rem] bg-[#f7e6d2] p-8 sm:p-12 lg:grid-cols-[1.5fr_1fr]">
          <blockquote>
            <span className="font-display block text-7xl leading-[0.6] text-[#b7791f]" aria-hidden>&ldquo;</span>
            <p className="font-display text-balance text-2xl font-semibold leading-snug text-[#3b2710] sm:text-3xl">
              We did not build features. We fixed the things that kept us up at night.
            </p>
            <footer className="mt-5 text-sm text-[#6b5234]">Founder, My Care Academy · running a home care company since 2002</footer>
          </blockquote>
          <div className="grid gap-3">
            {[
              ["2002", "Started delivering home care in Stockport"],
              ["Still today", "We run both systems in our own care company, every day"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/60 px-4 py-3.5 text-sm text-[#4a3417]">
                <span className="block font-mono text-xs text-[#8a4d0c]">{k}</span>
                {v}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand
        title="Ready to see it with your own rota?"
        body="Tell us about your service and we will talk through what would help most: the rostering system, the training, a mock inspection, or all three."
      />
    </>
  );
}
