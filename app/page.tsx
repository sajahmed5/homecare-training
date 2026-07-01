import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const FEATURES = [
  {
    title: "Mandatory training",
    body: "26 CQC-aligned courses with interactive content, assessments and branded certificates.",
  },
  {
    title: "Compliance you can see",
    body: "Red/amber/green dashboards, automatic renewals, and reminders before anyone falls behind.",
  },
  {
    title: "Forms & recruitment",
    body: "Build conditional forms and track candidates end-to-end — right through to onboarding.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Logo width={150} />
        <div className="flex items-center gap-2">
          <Link href="/verify" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Verify a certificate
          </Link>
          <Link href="/login" className={buttonVariants({ size: "sm" })}>
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-6 inline-flex items-center rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground">
          UK care sector · CQC-ready records
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Training and compliance for care providers
        </h1>
        <p className="mt-5 max-w-xl text-balance text-lg text-muted-foreground">
          Assign courses, track completion, and issue certificates — and know
          who&apos;s falling behind before your inspector does.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className={buttonVariants({ size: "lg" })}>
            Sign in
          </Link>
          <a
            href="mailto:hello@mycareacademy.co.uk"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Request access
          </a>
        </div>

        <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-5 text-left shadow-sm"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="size-2 rounded-full bg-primary" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 py-8 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <span>© My Care Academy</span>
          <Link href="/privacy" className="hover:underline">
            Privacy policy
          </Link>
        </div>
      </footer>
    </main>
  );
}
