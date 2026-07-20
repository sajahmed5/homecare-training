import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SERVICES } from "@/lib/services";
import { tint } from "@/lib/topic-theme";

export default function Home() {
  return (
    <>
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-16 text-center sm:py-24">
        <span className="mb-6 inline-flex items-center rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
          UK care sector · CQC-ready records
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Training, compliance and management support for care providers
        </h1>
        <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
          From mandatory e-learning and mock CQC inspections to hands-on help
          running your service — know where you stand before your inspector
          does.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/services" className={buttonVariants({ size: "lg" })}>
            Explore our services
          </Link>
          <a
            href="mailto:hello@mycareacademy.co.uk"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Request access
          </a>
        </div>
      </section>

      <section className="border-t bg-card/40">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How we support your service
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything from the training your staff have to complete, to the
              governance structures that hold it all together.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.slug}
                  href={`/services#${service.slug}`}
                  className="group rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="mb-3 flex size-10 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: tint(service.color, "1a"),
                      color: service.color,
                    }}
                  >
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {service.summary}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Learn more
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">
            Not sure where to start?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tell us about your service and we will talk through what would help
            most — whether that is a mock inspection, getting your governance in
            order, or training your team.
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
          </div>
        </div>
      </section>
    </>
  );
}
