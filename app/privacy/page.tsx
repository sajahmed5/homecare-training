import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — My Care Academy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        How My Care Academy handles your personal data under UK GDPR.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground">
            Who we are
          </h2>
          <p>
            My Care Academy provides training and compliance software to UK care
            organisations. Your care organisation is the data controller for
            your records; we process data on their behalf.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            What we store
          </h2>
          <p>
            Your name and email, the courses assigned to you, your progress and
            assessment results, certificates, and (where applicable) recruitment
            and form submissions your organisation collects.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Where it is stored
          </h2>
          <p>
            Data is hosted in the EU (Frankfurt) on Supabase, encrypted in
            transit (TLS) and at rest. UK personal data is processed under the
            UK–EU adequacy decision.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Your rights
          </h2>
          <p>
            You can download a copy of your data or delete your account at any
            time from your dashboard. To exercise other rights, contact your
            organisation&apos;s administrator or{" "}
            <a href="mailto:privacy@mycareacademy.co.uk" className="underline">
              privacy@mycareacademy.co.uk
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Cookies</h2>
          <p>
            We use only essential cookies required to keep you signed in. We do
            not use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">Retention</h2>
          <p>
            Training records are retained for the period configured by your
            organisation (default 36 months) to meet CQC and audit
            requirements, then deleted or anonymised.
          </p>
        </section>
      </div>
    </main>
  );
}
