import type { Metadata } from "next";
import { GraduationCap, ShieldCheck, Users } from "lucide-react";
import { PACKAGE_TIERS, TIER_DETAILS } from "@/lib/organisations";
import TierCards from "./tier-cards";
import { Arrow, CtaBand, H2, PillLink, Section } from "../../ui";

export const metadata: Metadata = {
  title: "Training pricing — My Care Academy",
  description:
    "Plans for My Care Academy Training: CQC-aligned e-learning with verifiable certificates, forms, recruitment compliance and Care Certificate assessment. Unlimited learners on every plan.",
};

// PROPOSED monthly prices per organisation (9 Sept 2026) — Stripe holds the
// real prices and they are not yet configured (PLATFORM_TIER_GBP_*), so these
// are placeholders for Saj to confirm. Tier names and features come from
// lib/organisations, the same source the org Account page uses.
const PRICE: Record<string, { monthly: number; highlight?: boolean }> = {
  core: { monthly: 49 },
  core_forms: { monthly: 79, highlight: true },
  core_recruitment: { monthly: 79 },
  full: { monthly: 129 },
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
      <section className="mca-day -mt-24 px-4 pb-10 pt-32 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#b7791f]">
            <GraduationCap className="size-4" /> Training · pricing
          </div>
          <h1 className="font-display mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-[#2b1d0e] sm:text-6xl">
            One price for the whole team
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[#2b1d0e]/70">
            Unlimited learners on every plan. Four plans, from the course library on its own to the complete platform. Prices and plan contents are being finalised.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#2b1d0e]/75">
            <li className="inline-flex items-center gap-2"><Users className="size-4 text-[#b7791f]" /> Unlimited learners and admins</li>
            <li className="inline-flex items-center gap-2"><GraduationCap className="size-4 text-[#b7791f]" /> 26 CQC-aligned courses</li>
            <li className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#b7791f]" /> Certificates verifiable online</li>
          </ul>
        </div>
      </section>

      <Section className="-mt-4 pt-0">
        <TierCards
          tiers={PACKAGE_TIERS.map((tier) => ({
            value: tier.value,
            label: tier.label,
            monthly: PRICE[tier.value].monthly,
            tagline: TIER_DETAILS[tier.value].tagline,
            features: TIER_DETAILS[tier.value].features,
            highlight: PRICE[tier.value].highlight,
          }))}
        />
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
