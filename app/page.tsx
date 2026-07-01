import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="mb-6 inline-flex items-center rounded-full border px-3 py-1 text-sm text-muted-foreground">
        UK care sector · CQC-ready records
      </span>

      <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        My Care Academy
      </h1>

      <p className="mt-4 max-w-xl text-balance text-lg text-muted-foreground">
        A compliance-first training platform for care organisations. Assign
        courses, track completion, issue certificates — and know who is falling
        behind before your inspector does.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg">Sign in</Button>
        <Button size="lg" variant="outline">
          Request access
        </Button>
      </div>

      <p className="mt-16 text-sm text-muted-foreground">
        Phase 0 skeleton — foundation, auth and multi-tenancy come next.
      </p>
    </main>
  );
}
