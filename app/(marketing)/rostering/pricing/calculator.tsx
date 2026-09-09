"use client";

import { useState } from "react";

/** Live cost calculator — figures are the PROPOSED prices in pricing/page.tsx. */
export default function Calculator({
  perClientWeek,
  minHome,
  perResidentWeek,
  minCareHome,
}: {
  perClientWeek: number;
  minHome: number;
  perResidentWeek: number;
  minCareHome: number;
}) {
  const [clients, setClients] = useState(60);
  const [residents, setResidents] = useState(0);
  const homeMonthly = clients > 0 ? Math.max(minHome, (clients * perClientWeek * 52) / 12) : 0;
  const careMonthly = residents > 0 ? Math.max(minCareHome, (residents * perResidentWeek * 52) / 12) : 0;
  const total = homeMonthly + careMonthly;
  const gbp = (n: number) => n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
  return (
    <div className="grid gap-8 rounded-[2rem] bg-white p-8 shadow-xl shadow-[#134f63]/10 ring-1 ring-[#134f63]/8 md:grid-cols-[1.1fr_1fr]">
      <div className="space-y-8">
        <label className="block">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Home-care clients</span>
            <span className="font-display text-2xl font-semibold text-[#134f63]">{clients}</span>
          </div>
          <input type="range" min={0} max={400} step={5} value={clients} onChange={(e) => setClients(Number(e.target.value))} className="mt-3 w-full accent-[#134f63]" />
          <div className="mt-1 flex justify-between text-xs text-[#0f2f3c]/50"><span>0</span><span>400</span></div>
        </label>
        <label className="block">
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Care-home residents</span>
            <span className="font-display text-2xl font-semibold text-[#134f63]">{residents}</span>
          </div>
          <input type="range" min={0} max={200} step={5} value={residents} onChange={(e) => setResidents(Number(e.target.value))} className="mt-3 w-full accent-[#134f63]" />
          <div className="mt-1 flex justify-between text-xs text-[#0f2f3c]/50"><span>0</span><span>200</span></div>
        </label>
        <p className="text-sm text-[#0f2f3c]/60">
          Carers, office users and family logins are unlimited and free. Clients on hold or archived are not counted.
        </p>
      </div>
      <div className="mca-night rounded-[1.5rem] p-7 text-white">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8fd3ea]">Your estimate</div>
        <div className="font-display mt-3 text-5xl font-semibold">{gbp(total)}<span className="text-lg font-medium text-white/60"> /month</span></div>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-white/70">Home care</dt><dd>{gbp(homeMonthly)}</dd></div>
          <div className="flex justify-between"><dt className="text-white/70">Care homes</dt><dd>{gbp(careMonthly)}</dd></div>
          <div className="flex justify-between border-t border-white/15 pt-2"><dt className="text-white/70">Per home-care client</dt><dd>{clients ? gbp(homeMonthly / clients) : "—"} /month</dd></div>
        </dl>
        <p className="mt-5 text-xs text-white/55">Excludes VAT. Minimums apply below small numbers. Set-up waived on annual plans.</p>
      </div>
    </div>
  );
}
