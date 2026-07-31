"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeekPoint } from "@/lib/org-learners";

export function CompletionsChart({ data }: { data: WeekPoint[] }) {
  const total = data.reduce((n, p) => n + p.count, 0);
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No course completions in this period yet.
      </p>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="week" fontSize={11} tickLine={false} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} fontSize={12} width={28} tickLine={false} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="count" name="Completions" fill="#0d9488" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
