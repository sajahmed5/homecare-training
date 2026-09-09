import type { Metadata } from "next";
import { Check, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { PACKAGE_TIERS, TIER_DETAILS } from "@/lib/organisations";
import { Arrow, CtaBand, H2, Hero, PillLink, Section } from "../../ui";

export const metadata: Metadata = {
  title: "Training pricing — My Care Academy",
  description:
    "Plans for My Care Academy Training: CQC-aligned e-learning with verifiable certificates, forms, recruitment compliance and Care Certificate assessment. Unlimited learners on every plan.",
};

// PROPOSED monthly prices per organisation (9 Sept 2026) — Stripe holds the
// real prices and they are not yet configured (PLATFORM_TIER_GBP_*), so these
// are placeholders for Saj to confirm. Tier names and features come from
// lib/organisations, the same source the org Account page uses.
const PRICE: Record<string, { month: string; note: string; highlight?: boolean }> = {
  core: { month: "£49", note: "per organisation per month" },
  core_forms: { month: "£79", note: "per organisation per month", highlight: true },
  core_recruitment: { month: "£79", note: "per organisation per month" },
  full: { month: "£129", note: "per organisation per month" },
};

const FAQ: [string, string][] = [
  ["Is there a per-learner charge?", "No. Every plan includes unlimited learners and admin users. You pay one monthly price for your organisation."],
  ["Which courses are included?", "The full library of 26 CQC-aligned courses, with interactive content, a 20-question assessment and a branded, verifiable certificate for each."],
  ["Can carers do the training on their phones?", "Yes. Courses are built for phones first, and most are finished in one sitting."],
  ["Does training show up in the rostering system?", "If you use My Care Academy Rostering, certificates land in the carer's record automatically and overdue training is counted on the Oversight page."],
  ["Is there a contract?", "Monthly plans can be cancelled at any time. Annual plans get two months free."],
  ["What about mock CQC inspections and management support?", "Those are quoted separately, based on the size of your service. Ask us and we will talk it through."],
];

export default function TrainingPricingPage() {
  return (
    <>
      <Hero
        eyebrow={<>My Care Academy Training · pricing</>}
        title={<>One price for the<br />whole team</>}
        body="Unlimited learners on every plan. Four plans, from the course library on its own to the complete platform. Prices and plan contents are being finalised."
        trust={[
          { icon: Users, label: "Unlimited learners and admins" },
          { icon: GraduationCap, label: "26 CQC-aligned courses" },
          { icon: ShieldCheck, label: "Certificates verifiable online" },
        ]}
      >
        <PillLink href="mailto:hello@mycareacademy.co.uk?subject=Training%20access" tone="white">
          Request access <Arrow />
        </PillLink>
        <PillLink href="/training" tone="outline-white">
          See the training
        </PillLink>
      </Hero>

      <Section className="-mt-10 pt-0 sm:-mt-14">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {PACKAGE_TIERS.map((tier) => {
            const d = TIER_DETAILS[tier.value];
            const p = PRICE[tier.value];
            return (
              <div
                key={tier.value}
                className={`flex flex-col rounded-[2rem] p-7 shadow-xl shadow-[#134f63]/10 ring-1 ${
                  p.highlight ? "bg-[#134f63] text-white ring-[#134f63]" : "bg-white ring-[#134f63]/8"
                }`}
              >
                <div className={`text-xs font-semibold uppercase tracking-wide ${p.highlight ? "text-white/70" : "text-[#1d6f8a]"}`}>
                  {tier.label}
                </div>
                <div className="font-display mt-3 text-4xl font-semibold">{p.month}</div>
                <div className={`text-sm ${p.highlight ? "text-white/70" : "text-[#0f2f3c]/60"}`}>{p.note}</div>
                <p className={`mt-4 text-sm ${p.highlight ? "text-white/85" : "text-[#0f2f3c]/70"}`}>{d.tagline}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {d.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className={`mt-0.5 size-4 shrink-0 ${p.highlight ? "text-[#f7e6d2]" : "text-[#059669]"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <PillLink
                  href={`mailto:hello@mycareacademy.co.uk?subject=Training%20${encodeURIComponent(tier.label)}%20plan`}
                  tone={p.highlight ? "white" : "dark"}
                  className="mt-auto pt-3"
                >
                  Choose {tier.label}
                </PillLink>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-sm text-[#0f2f3c]/55">Prices exclude VAT. Annual plans get two months free.</p>
      </Section>

      <Section tone="soft">
        <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <H2>Mock inspections and management support</H2>
            <p className="mt-3 text-[#0f2f3c]/65">
              A mock CQC inspection, help with governance, ISO standards, recruitment or client feedback is quoted for
              your service, not sold as a plan. Most providers start with a mock inspection and go from there.
            </p>
          </div>
          <div className="flex md:justify-end">
            <PillLink href="mailto:hello@mycareacademy.co.uk?subject=Mock%20inspection">
              Ask for a quote <Arrow />
            </PillLink>
          </div>
        </div>
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
        title="Start with a conversation"
        body="Tell us about your service and we will set you up on the right plan, with your team invited and their first courses assigned."
      />
    </>
  );
}
