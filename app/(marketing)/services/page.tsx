import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SERVICES } from "@/lib/services";
import { tint } from "@/lib/topic-theme";

export const metadata: Metadata = {
  title: "Services — My Care Academy",
  description:
    "Mock CQC inspections, management and governance support, ISO standards guidance, mandatory e-learning, recruitment support and quality feedback tools for UK care providers.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Our services
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          We work with UK care providers across training, compliance and the
          day-to-day business of running a well-led service.
        </p>

        {/* Jump links — the same anchors the home page and footer link into. */}
        <nav className="mt-8 flex flex-wrap justify-center gap-2">
          {SERVICES.map((service) => (
            <a
              key={service.slug}
              href={`#${service.slug}`}
              className="rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground hover:shadow-sm"
            >
              {service.name}
            </a>
          ))}
        </nav>
      </section>

      <div className="border-t bg-card/40">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <section
                key={service.slug}
                id={service.slug}
                className="scroll-mt-24 border-b py-12 last:border-0"
              >
                <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
                  <div>
                    <div
                      className="flex size-12 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: tint(service.color, "1a"),
                        color: service.color,
                      }}
                    >
                      <Icon className="size-6" />
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold tracking-tight">
                      {service.name}
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                      {service.intro}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      What&apos;s included
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {service.includes.map((item) => (
                        <li key={item} className="flex gap-3 text-sm">
                          <Check
                            className="mt-0.5 size-4 shrink-0"
                            style={{ color: service.color }}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">
            Talk to us about your service
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Every service is different. Tell us where you are and we will be
            straight with you about what would make the biggest difference.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:hello@mycareacademy.co.uk"
              className={buttonVariants({ size: "lg" })}
            >
              Email us
            </a>
            <a
              href="tel:+441616944701"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              0161 694 4701
            </a>
            <Link
              href="/login"
              className={buttonVariants({ size: "lg", variant: "ghost" })}
            >
              Sign in to the portal
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
