"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Slice, CoursePopularity } from "@/lib/platform-analytics";

const PALETTE = ["#0d9488", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#0284c7"];

/** Vertical bars for a small category series (tier mix, growth by month). */
export function CategoryBarChart({
  data,
  color = "#0d9488",
}: {
  data: Slice[];
  color?: string;
}) {
  if (data.every((d) => d.value === 0)) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" fontSize={12} tickLine={false} interval={0} />
        <YAxis allowDecimals={false} fontSize={12} width={28} tickLine={false} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Tier mix with a distinct colour per tier. */
export function TierMixChart({ data }: { data: Slice[] }) {
  if (data.every((d) => d.value === 0)) {
    return <p className="text-sm text-muted-foreground">No organisations yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" fontSize={11} tickLine={false} interval={0} />
        <YAxis allowDecimals={false} fontSize={12} width={28} tickLine={false} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal bars for the most-enrolled courses. */
export function CoursePopularityChart({ data }: { data: CoursePopularity[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No enrolments yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
        <XAxis type="number" allowDecimals={false} fontSize={12} tickLine={false} />
        <YAxis
          type="category"
          dataKey="title"
          width={150}
          fontSize={11}
          tickLine={false}
        />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="enrolments" name="Enrolments" fill="#6366f1" radius={[0, 4, 4, 0]} />
        <Bar dataKey="completions" name="Completions" fill="#0d9488" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
