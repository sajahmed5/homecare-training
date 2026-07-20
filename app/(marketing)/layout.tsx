import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/services", label: "Services", hideOnMobile: false },
  { href: "/verify", label: "Verify a certificate", hideOnMobile: true },
];

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-card/60">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" aria-label="My Care Academy home" className="shrink-0">
            <Logo width={150} />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                // "Verify a certificate" is long; it lives in the footer too,
                // so drop it from the bar on narrow screens. max-sm:hidden (a
                // media query) is used over plain `hidden`, which would lose to
                // the `inline-flex` in buttonVariants' base classes.
                className={`${buttonVariants({ variant: "ghost", size: "sm" })}${
                  item.hideOnMobile ? " max-sm:hidden" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="border-t bg-card/60">
        <div className="mx-auto w-full max-w-5xl px-6 py-10 text-sm">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <Logo width={140} />
              <p className="mt-3 text-muted-foreground">
                Training, compliance and management support for UK care
                providers.
              </p>
            </div>

            <div>
              <h2 className="font-semibold">Services</h2>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>
                  <Link href="/services" className="hover:underline">
                    All services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services#mock-cqc-inspections"
                    className="hover:underline"
                  >
                    Mock CQC inspections
                  </Link>
                </li>
                <li>
                  <Link
                    href="/services#management-support"
                    className="hover:underline"
                  >
                    Management support
                  </Link>
                </li>
                <li>
                  <Link href="/verify" className="hover:underline">
                    Verify a certificate
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold">Get in touch</h2>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="mailto:hello@mycareacademy.co.uk"
                    className="hover:underline"
                  >
                    hello@mycareacademy.co.uk
                  </a>
                </li>
                <li>
                  <a href="tel:+441616944701" className="hover:underline">
                    0161 694 4701
                  </a>
                </li>
                <li className="not-italic">
                  107 Wellington Road,
                  <br />
                  Stockport, SK4 2LR
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-muted-foreground">
            <span>© My Care Academy</span>
            <Link href="/privacy" className="hover:underline">
              Privacy policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
