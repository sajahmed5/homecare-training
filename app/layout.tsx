import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  display: "swap",
});

// Absolute base for canonical + Open Graph URLs, so shared links preview
// correctly. Follows NEXT_PUBLIC_SITE_URL when set (e.g. a preview deploy),
// otherwise the live domain.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "")
  ?? "https://www.mycareacademy.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "My Care Academy",
  description:
    "Compliance-first training platform for the UK care sector — training, certificates and CQC-ready records for care organisations.",
  openGraph: {
    type: "website",
    siteName: "My Care Academy",
    url: siteUrl,
    title: "My Care Academy",
    description:
      "Compliance-first training platform for the UK care sector — training, certificates and CQC-ready records for care organisations.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
