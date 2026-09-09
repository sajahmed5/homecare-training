import type { Metadata } from "next";
import { Check, GraduationCap, ShieldCheck, Smartphone } from "lucide-react";
import { SERVICES } from "@/lib/services";
import { tint } from "@/lib/topic-theme";
import { Arrow, Chip, CtaBand, H2, Hero, PillLink, Section, Stat } from "../ui";

export const metadata: Metadata = {
  title: "Training — My Care Academy",
  description:
    "Mandatory e-learning with verifiable certificates, mock CQC inspections, management and governance support, ISO standards guidance and recruitment support for UK care providers.",
};

// One of the two main pages (Saj, 9 Sept 2026). Content is the SERVICES data
// the old /services page used; /services now redirects here.
export default function TrainingPage() {
  const elearning = SERVICES.find((s) => s.slug === "elearning-training");
  return (
    <>
      <Hero
        eyebrow={<>My Care Academy Training</>}
        title={<>Training and compliance<br />that holds up to an inspection</>}
        body="Mandatory e-learning your carers finish on their phones, certificates anyone can verify, mock CQC inspections, and hands-on help running a well-led service. Know where you stand before your inspector does."
        trust={[
          { icon: GraduationCap, label: "26 CQC-aligned courses" },
          { icon: ShieldCheck, label: "Certificates verifiable online" },
          { icon: Smartphone, label: "Done on a phone, in minutes" },
        ]}
      >
        <PillLink href="mailto:hello@mycareacademy.co.uk?subject=Training%20access" tone="white">
          Request access <Arrow />
        </PillLink>
        <PillLink href="/training/pricing" tone="outline-white">
          See pricing
        </PillLink>
      </Hero>
      <Section className="pt-4">
        <nav className="flex flex-wrap justify-center gap-2">
          {SERVICES.map((s) => (
            <Chip key={s.slug} href={`#${s.slug}`} icon={s.icon}>
              {s.name}
            </Chip>
          ))}
        </nav>
      </Section>

      <Section className="pt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat n="26" label="CQC-aligned courses, written for UK adult social care" />
          <Stat n="80%" label="pass mark on a 20-question assessment per course" />
          <Stat n="100%" label="of certificates independently verifiable online" />
          <Stat n="1 tap" label="from a carer's phone to their next course" />
        </div>
        {elearning && (
          <p className="mx-auto mt-8 max-w-3xl text-center text-[#0f2f3c]/65">
            {elearning.intro}
          </p>
        )}
      </Section>

      {SERVICES.map((service, i) => {
        const Icon = service.icon;
        return (
          <Section key={service.slug} id={service.slug} tone={i % 2 === 0 ? "soft" : "plain"} className="scroll-mt-28 pt-6">
            <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
              <div>
                <div
                  className="flex size-12 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: tint(service.color, "1a"), color: service.color }}
                >
                  <Icon className="size-6" />
                </div>
                <H2 className="mt-4">{service.name}</H2>
                <p className="mt-3 text-[#0f2f3c]/65">{service.intro}</p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#134f63]/8">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#0f2f3c]/55">
                  What&apos;s included
                </h3>
                <ul className="mt-4 space-y-3">
                  {service.includes.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0" style={{ color: service.color }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        );
      })}

      <Section tone="deep">
        <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <H2 className="text-white">Training that feeds the rota</H2>
            <p className="mt-4 text-white/75">
              Use My Care Academy Rostering as well and every certificate lands
              in the carer&apos;s record automatically. Overdue and due-soon
              training shows on the Oversight page, and a carer whose mandatory
              training has lapsed is flagged before they are rostered.
            </p>
          </div>
          <div className="flex md:justify-end">
            <PillLink href="/rostering" tone="white">
              See the rostering system <Arrow />
            </PillLink>
          </div>
        </div>
      </Section>

      <CtaBand
        title="Start with a conversation"
        body="Tell us about your service and we will talk through what would help most, whether that is a mock inspection, getting your governance in order, or training your team."
      />
    </>
  );
}
