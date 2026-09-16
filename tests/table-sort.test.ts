import { describe, it, expect } from "vitest";
import {
  dateColumn,
  newestFirst,
  nextSort,
  numberColumn,
  sortRows,
  statusRank,
  textColumn,
  type SortColumn,
} from "../lib/table-sort";

interface R {
  name: string;
  n: number | null;
  due: string | null;
  status: string;
  completedAt: string | null;
}
const r = (over: Partial<R>): R => ({
  name: "x",
  n: null,
  due: null,
  status: "not_started",
  completedAt: null,
  ...over,
});
const names = (rows: R[]) => rows.map((x) => x.name);

describe("clicking a heading (issue #40)", () => {
  it("first click uses the column's own direction; second reverses; another column starts fresh", () => {
    let s = nextSort(null, "due", "desc");
    expect(s).toEqual({ key: "due", dir: "desc" });
    s = nextSort(s, "due", "desc");
    expect(s).toEqual({ key: "due", dir: "asc" });
    expect(nextSort(s, "name", "asc")).toEqual({ key: "name", dir: "asc" });
  });

  it("text sorts A–Z ignoring case", () => {
    const rows = [r({ name: "beth" }), r({ name: "Adam" }), r({ name: "carl" })];
    expect(names(sortRows(rows, textColumn((x) => x.name), "asc"))).toEqual(["Adam", "beth", "carl"]);
    expect(names(sortRows(rows, textColumn((x) => x.name), "desc"))).toEqual(["carl", "beth", "Adam"]);
  });

  it("numbers and dates default to largest / newest first", () => {
    expect(numberColumn<R>((x) => x.n).first).toBe("desc");
    expect(dateColumn<R>((x) => x.due).first).toBe("desc");
    const rows = [r({ name: "old", due: "2026-01-01" }), r({ name: "new", due: "2026-09-01" })];
    expect(names(sortRows(rows, dateColumn((x) => x.due), "desc"))).toEqual(["new", "old"]);
  });

  it("keeps blanks at the bottom in both directions", () => {
    const rows = [r({ name: "blank" }), r({ name: "two", n: 2 }), r({ name: "one", n: 1 })];
    const col = numberColumn<R>((x) => x.n);
    expect(names(sortRows(rows, col, "desc"))).toEqual(["two", "one", "blank"]);
    expect(names(sortRows(rows, col, "asc"))).toEqual(["one", "two", "blank"]);
  });

  it("leaves ties in their original order", () => {
    const rows = [r({ name: "a", n: 1 }), r({ name: "b", n: 1 }), r({ name: "c", n: 1 })];
    expect(names(sortRows(rows, numberColumn((x) => x.n), "desc"))).toEqual(["a", "b", "c"]);
  });

  it("Status: overdue first; clicked again, the latest completed is on top", () => {
    const status: SortColumn<R> = {
      first: "asc",
      value: (x) => statusRank(x.status, x.name === "late"),
      tieBreak: newestFirst((x) => x.completedAt),
    };
    const rows = [
      r({ name: "done-old", status: "completed", completedAt: "2026-08-01T10:00:00Z" }),
      r({ name: "fresh", status: "not_started" }),
      r({ name: "done-new", status: "completed", completedAt: "2026-09-10T10:00:00Z" }),
      r({ name: "late", status: "in_progress" }),
      r({ name: "going", status: "in_progress" }),
    ];
    expect(names(sortRows(rows, status, "asc"))).toEqual(["late", "going", "fresh", "done-new", "done-old"]);
    expect(names(sortRows(rows, status, "desc"))).toEqual(["done-new", "done-old", "fresh", "going", "late"]);
  });
});
