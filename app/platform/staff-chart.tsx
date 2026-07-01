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

export interface StaffDatum {
  name: string;
  staff: number;
}

export function StaffChart({ data }: { data: StaffDatum[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No organisations to chart yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" fontSize={12} tickLine={false} />
        <YAxis allowDecimals={false} fontSize={12} width={28} tickLine={false} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="staff" fill="#2b7a99" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
