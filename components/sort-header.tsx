"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { nextSort, sortRows, type SortColumn, type SortDir } from "@/lib/table-sort";

/**
 * Sort state for a table whose headings can be clicked (issue #40). Starts
 * unsorted — the rows keep the order they arrived in until someone clicks.
 */
export function useTableSort<T, K extends string>(
  rows: T[],
  columns: Record<K, SortColumn<T>>,
) {
  const [sort, setSort] = useState<{ key: K; dir: SortDir } | null>(null);
  const sorted = useMemo(
    () => (sort ? sortRows(rows, columns[sort.key], sort.dir) : rows),
    [rows, columns, sort],
  );
  const toggle = (key: K) => setSort((cur) => nextSort(cur, key, columns[key].first));
  return { sorted, sort, toggle };
}

/** A table heading that sorts its column when clicked. */
export function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir?: SortDir;
  onClick: () => void;
}) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th
      className="p-0 font-medium"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex min-h-11 w-full items-center gap-1 whitespace-nowrap px-3 py-2 text-left transition-colors hover:text-foreground sm:min-h-0 ${
          active ? "text-foreground" : ""
        }`}
      >
        {label}
        <Icon className={`size-3.5 shrink-0 ${active ? "" : "opacity-40"}`} aria-hidden />
      </button>
    </th>
  );
}
