import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { VERSION_LABEL } from "@/lib/version";
import "./marketing.css";

// Two main products, two main pages (Saj, 9 Sept 2026).
const NAV = [
  { href: "/rostering", label: "Rostering" },
  { href: "/training", label: "Training" },
  { href: "/verify", label: "Verify a certificate", hideOnMobile: true },
];

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col bg-white text-[#0f2f3c]">
      {/* White pill bar floating over each page's gradient opener. */}
      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-full bg-white/95 px-5 py-2.5 shadow-lg shadow-[#134f63]/10 ring-1 ring-[#134f63]/8 backdrop-blur sm:px-6">
          <Link href="/" aria-label="My Care Academy home" className="shrink-0">
            <Logo width={140} />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm font-medium text-[#0f2f3c]/80 transition hover:bg-[#134f63]/6 hover:text-[#0f2f3c]${
                  item.hideOnMobile ? " max-md:hidden" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="hidden rounded-full border border-[#134f63]/15 px-4 py-2 text-sm font-medium text-[#0f2f3c] transition hover:bg-[#134f63]/5 sm:inline-flex"
            >
              Sign in
            </Link>
            <a
              href="mailto:hello@mycareacademy.co.uk?subject=Demo%20request"
              className="inline-flex items-center gap-2 rounded-full bg-[#134f63] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d6f8a]"
            >
              Book a demo <ArrowRight className="size-4" />
            </a>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>

      <footer className="mt-16 border-t border-[#134f63]/10 bg-[#f6fafc]">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 text-sm">
          <div className="grid gap-10 sm:grid-cols-4">
            <div>
              <Logo width={140} />
              <p className="mt-4 text-[#0f2f3c]/65">
                Training, rostering software and management support for UK
                care providers. Built by people who ran care.
              </p>
            </div>

            <div>
              <h2 className="font-semibold">Rostering</h2>
              <ul className="mt-3 space-y-2 text-[#0f2f3c]/65">
                <li><Link href="/rostering" className="hover:text-[#134f63]">Overview</Link></li>
                <li><Link href="/rostering#carer-app" className="hover:text-[#134f63]">Carer app</Link></li>
                <li><Link href="/rostering#monitoring" className="hover:text-[#134f63]">Live monitoring</Link></li>
                <li><Link href="/rostering#finance" className="hover:text-[#134f63]">Finance</Link></li>
                <li><Link href="/rostering#care-homes" className="hover:text-[#134f63]">Care homes</Link></li>
                <li><Link href="/rostering/pricing" className="hover:text-[#134f63]">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold">Training</h2>
              <ul className="mt-3 space-y-2 text-[#0f2f3c]/65">
                <li><Link href="/training" className="hover:text-[#134f63]">Overview</Link></li>
                <li><Link href="/training#elearning-training" className="hover:text-[#134f63]">eLearning &amp; mandatory training</Link></li>
                <li><Link href="/training#mock-cqc-inspections" className="hover:text-[#134f63]">Mock CQC inspections</Link></li>
                <li><Link href="/training#management-support" className="hover:text-[#134f63]">Management support</Link></li>
                <li><Link href="/training/pricing" className="hover:text-[#134f63]">Pricing</Link></li>
                <li><Link href="/verify" className="hover:text-[#134f63]">Verify a certificate</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold">Get in touch</h2>
              <ul className="mt-3 space-y-2 text-[#0f2f3c]/65">
                <li>
                  <a href="mailto:hello@mycareacademy.co.uk" className="hover:text-[#134f63]">
                    hello@mycareacademy.co.uk
                  </a>
                </li>
                <li>
                  <a href="tel:+441616944701" className="hover:text-[#134f63]">
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

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#134f63]/10 pt-6 text-[#0f2f3c]/55">
            <span className="flex items-center gap-2">
              © My Care Academy
              <span className="text-xs text-[#0f2f3c]/40">{VERSION_LABEL}</span>
            </span>
            <Link href="/privacy" className="hover:text-[#134f63]">
              Privacy policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
