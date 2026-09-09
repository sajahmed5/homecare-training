import type { Metadata } from "next";
import { Check, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import Calculator from "./calculator";
import { Arrow, CtaBand, Eyebrow, H2, PillLink, Section } from "../../ui";

export const metadata: Metadata = {
  title: "Rostering pricing — My Care Academy",
  description:
    "Simple per-client pricing for My Care Academy Rostering. Everything included, unlimited carers and office users, 30-day free trial.",
};

// PROPOSED figures (9 Sept 2026) — Saj has not signed these off. Change the
// numbers here and nowhere else; the brochure PDFs carry the same values.
const HOME = { perWeek: "£2.20", perMonth: "about £9.50", min: "£199" };
const CARE_HOME = { perWeek: "£1.50", min: "£149" };
const SETUP = "£950";

const INCLUDED = [
  "Rota, runs, double-ups, cover and holds",
  "Carer app with GPS or QR clock-in, tasks, medication, notes and photos",
  "Live call monitoring with alerts that escalate to on-call",
  "Invoices, timesheets, payroll CSV and road mileage",
  "Risk assessments and care plans drafted by AI",
  "Supervisions, spot-checks, appraisals and QAs with due dates",
  "Complaints and safeguarding investigations",
  "Oversight page and every report",
  "Family portal, messaging and push notifications",
  "Care homes: residents, shifts and package invoicing",
  "Unlimited carers, office users and family logins",
  "UK support from people who have run a care office",
];

const FAQ: [string, string][] = [
  ["What counts as an active client?", "Anyone with a visit on the rota in that week. Clients on hold or archived are not charged."],
  ["Are carers charged for?", "No. Add as many carers, office users and family logins as you like."],
  ["Is there a contract?", "Monthly plans can be cancelled at any time. Annual plans waive the set-up fee."],
  ["What does set-up include?", "We import your clients, carers, rotas and rates from your current system, train the office, and roll the app out to carers."],
  ["Do you charge for modules?", "No. Every feature on the Rostering page is included in the price."],
  ["Can I try it first?", "Yes. A 30-day trial on your own data, imported for you."],
];

export default function RosteringPricingPage() {
  return (
    <>
      <section className="mca-dusk mca-grid -mt-24 px-4 pb-14 pt-32 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8fd3ea]">Rostering · pricing</div>
          <h1 className="font-display mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl">
            Simple pricing. Everything included.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/75">One price per client. No modules, no per-user fees, no surprises at renewal.</p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            <li className="inline-flex items-center gap-2"><Sparkles className="size-4 text-[#8fd3ea]" /> Every feature included</li>
            <li className="inline-flex items-center gap-2"><HeartHandshake className="size-4 text-[#8fd3ea]" /> Unlimited carers and users</li>
            <li className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#8fd3ea]" /> 30-day free trial</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <PillLink href="mailto:hello@mycareacademy.co.uk?subject=Rostering%20trial" tone="white">
              Start a free trial <Arrow />
            </PillLink>
            <PillLink href="/rostering" tone="outline-white">
              See what it does
            </PillLink>
          </div>
        </div>
      </section>

      <Section className="-mt-8 pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-[#134f63]/10 ring-1 ring-[#134f63]/8">
            <Eyebrow>Home care</Eyebrow>
            <div className="font-display mt-4 text-5xl font-semibold text-[#134f63]">
              {HOME.perWeek}
              <span className="ml-2 text-base font-medium text-[#0f2f3c]/60">per active client per week</span>
            </div>
            <p className="mt-2 text-[#0f2f3c]/65">
              {HOME.perMonth} a month per client. Minimum {HOME.min} a month.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Unlimited carers, office users and family logins", "Every feature, every report", "Data import and office training"].map((t) => (
                <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#059669]" />{t}</li>
              ))}
            </ul>
            <PillLink href="mailto:hello@mycareacademy.co.uk?subject=Rostering%20trial" className="mt-7">
              Start a free trial <Arrow />
            </PillLink>
          </div>
          <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-[#134f63]/10 ring-1 ring-[#134f63]/8">
            <Eyebrow>Care homes</Eyebrow>
            <div className="font-display mt-4 text-5xl font-semibold text-[#134f63]">
              {CARE_HOME.perWeek}
              <span className="ml-2 text-base font-medium text-[#0f2f3c]/60">per resident per week</span>
            </div>
            <p className="mt-2 text-[#0f2f3c]/65">Minimum {CARE_HOME.min} a month per home.</p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Residents, rooms, funding and weekly rates", "Shifts with seats and the same carer app", "One council invoice per home, private residents on their own"].map((t) => (
                <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-[#059669]" />{t}</li>
              ))}
            </ul>
            <PillLink href="mailto:hello@mycareacademy.co.uk?subject=Care%20home%20demo" className="mt-7">
              Book a demo <Arrow />
            </PillLink>
          </div>
        </div>
        <div className="mt-6 grid gap-4 rounded-[2rem] bg-[#fbf3ea] p-6 sm:grid-cols-3 sm:p-8">
          <div>
            <h3 className="font-semibold">Set-up and data import</h3>
            <p className="mt-1 text-sm text-[#0f2f3c]/65">{SETUP} one-off, waived on an annual plan. Clients, carers, rotas and rates imported for you.</p>
          </div>
          <div>
            <h3 className="font-semibold">Training bundle</h3>
            <p className="mt-1 text-sm text-[#0f2f3c]/65">Take My Care Academy Training alongside Rostering and save 15% on the software. Certificates sync into carer records.</p>
          </div>
          <div>
            <h3 className="font-semibold">Multi-site and franchises</h3>
            <p className="mt-1 text-sm text-[#0f2f3c]/65">Several branches or a group of homes? Ask us about a group rate with one Oversight page across all of them.</p>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-[#0f2f3c]/55">Prices exclude VAT.</p>
      </Section>

      <Section className="pt-0">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <H2>Work it out for your service</H2>
          <p className="mt-3 text-[#0f2f3c]/65">Drag the sliders. The figure updates as you go.</p>
        </div>
        <Calculator perClientWeek={2.2} minHome={199} perResidentWeek={1.5} minCareHome={149} />
      </Section>

      <Section tone="soft">
        <div className="mx-auto max-w-2xl text-center">
          <H2>What&apos;s included</H2>
          <p className="mt-3 text-[#0f2f3c]/65">All of it. This is the whole list, not a starter tier.</p>
        </div>
        <ul className="mx-auto mt-8 grid max-w-4xl gap-x-8 gap-y-3 sm:grid-cols-2">
          {INCLUDED.map((t) => (
            <li key={t} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#059669]/12 text-[#059669]"><Check className="size-3" strokeWidth={3} /></span>
              {t}
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <H2 className="text-center">Questions people ask</H2>
          <dl className="mt-8 divide-y divide-[#134f63]/10">
            {FAQ.map(([q, a]) => (
              <div key={q} className="py-5">
                <dt className="font-semibold">{q}</dt>
                <dd className="mt-1 text-[#0f2f3c]/65">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      <CtaBand
        title="Try it on your own data"
        body="A 45-minute demo on your own numbers, then a 30-day trial with your real clients, carers and rotas imported."
      />
    </>
  );
}
