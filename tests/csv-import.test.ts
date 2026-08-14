import { describe, it, expect } from "vitest";
import { parseCsv } from "../app/org/csv-import";
import { bucketOf, type OrgLearnerRow } from "../lib/org-learners";
import type { LearnerStats } from "../lib/learner-data";

describe("parseCsv (bulk staff import, issue #16)", () => {
  it("parses a plain name,email,role file with a header", () => {
    const { rows, problem } = parseCsv(
      "name,email,role\nJo Smith,jo@example.com,learner\nSam Jones,sam@example.com,org_admin",
    );
    expect(problem).toBeUndefined();
    expect(rows).toEqual([
      { name: "Jo Smith", email: "jo@example.com", role: "learner" },
      { name: "Sam Jones", email: "sam@example.com", role: "org_admin" },
    ]);
  });

  it("keeps quoted names containing commas in one cell", () => {
    const { rows } = parseCsv(
      'name,email,role\n"Smith, Jo",jo@example.com,learner',
    );
    expect(rows).toEqual([
      { name: "Smith, Jo", email: "jo@example.com", role: "learner" },
    ]);
  });

  it("understands Excel-style headers and a BOM", () => {
    const { rows } = parseCsv(
      "﻿Full Name,Email Address,Role\nJo,jo@example.com,Learner",
    );
    expect(rows).toEqual([
      { name: "Jo", email: "jo@example.com", role: "learner" },
    ]);
  });

  it("handles semicolon-delimited exports", () => {
    const { rows } = parseCsv(
      "name;email;role\nJo Smith;jo@example.com;learner",
    );
    expect(rows).toEqual([
      { name: "Jo Smith", email: "jo@example.com", role: "learner" },
    ]);
  });

  it("defaults a missing role to learner", () => {
    const { rows } = parseCsv("name,email\nJo,jo@example.com");
    expect(rows[0].role).toBe("learner");
  });

  it("reports a helpful problem when there is no email column", () => {
    const { rows, problem } = parseCsv("name,phone\nJo,0777");
    expect(rows).toEqual([]);
    expect(problem).toMatch(/email/i);
  });

  it("skips blank lines and rows without an email", () => {
    const { rows } = parseCsv(
      "name,email,role\n\nJo,jo@example.com,learner\nNoEmail,,learner\n",
    );
    expect(rows).toHaveLength(1);
  });
});

function rowWith(stats: Partial<LearnerStats>): OrgLearnerRow {
  return {
    id: "u1",
    name: "Test",
    email: null,
    status: "active",
    stats: {
      assigned: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      expired: 0,
      certificates: 0,
      overdue: 0,
      expiring: 0,
      completionPct: 0,
      overallPct: 0,
      ...stats,
    },
    latestCompleted: null,
    lastAssignedAt: null,
    lastSeenAt: null,
    lastRemindedAt: null,
    timeSpentSeconds: 0,
    lateCompletions: 0,
  };
}

describe("bucketOf (learner status breakdown, issue #15)", () => {
  it("puts each learner in exactly one bucket, most urgent first", () => {
    expect(bucketOf(rowWith({}))).toBe("unassigned");
    expect(bucketOf(rowWith({ assigned: 3, overdue: 1, inProgress: 1 }))).toBe("overdue");
    expect(bucketOf(rowWith({ assigned: 3, inProgress: 1, notStarted: 1 }))).toBe("in_progress");
    expect(bucketOf(rowWith({ assigned: 3, notStarted: 3 }))).toBe("not_started");
    expect(bucketOf(rowWith({ assigned: 3, completed: 3 }))).toBe("completed");
  });

  it("buckets sum to the learner total", () => {
    const rows = [
      rowWith({}),
      rowWith({ assigned: 2, overdue: 2 }),
      rowWith({ assigned: 2, inProgress: 1, notStarted: 1 }),
      rowWith({ assigned: 1, notStarted: 1 }),
      rowWith({ assigned: 1, completed: 1 }),
    ];
    const counts = new Map<string, number>();
    for (const r of rows) {
      const b = bucketOf(r);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(rows.length);
  });
});
