import { describe, it, expect } from "vitest";
import { groupByBucket, purgeUserFiles } from "../lib/user-files";

describe("groupByBucket", () => {
  it("merges tables that share a bucket into one remove call", () => {
    // observation evidence and sign-off PDFs both live in observation-evidence;
    // two separate remove() calls would be two round trips for no reason.
    const out = groupByBucket([
      { bucket: "certificates", path: "a/1.pdf" },
      { bucket: "observation-evidence", path: "b/2.pdf" },
      { bucket: "observation-evidence", path: "b/3.pdf" },
    ]);
    expect(out).toHaveLength(2);
    expect(out.find((b) => b.bucket === "observation-evidence")!.paths).toEqual([
      "b/2.pdf",
      "b/3.pdf",
    ]);
  });

  it("drops empty paths and de-duplicates", () => {
    const out = groupByBucket([
      { bucket: "certificates", path: "a/1.pdf" },
      { bucket: "certificates", path: "a/1.pdf" },
      { bucket: "certificates", path: "" },
    ]);
    expect(out).toEqual([{ bucket: "certificates", paths: ["a/1.pdf"] }]);
  });

  it("finds nothing when the user has no files", () => {
    expect(groupByBucket([])).toEqual([]);
  });
});

/** Minimal stub of the bits of the client purgeUserFiles touches. */
function fakeAdmin(
  rows: Record<string, Record<string, string>[]>,
  removeError?: string,
) {
  const removed: { bucket: string; paths: string[] }[] = [];
  return {
    client: {
      from: (table: string) => ({
        select: () => ({
          eq: async () => ({ data: rows[table] ?? [] }),
        }),
      }),
      storage: {
        from: (bucket: string) => ({
          remove: async (paths: string[]) => {
            removed.push({ bucket, paths });
            return removeError ? { error: { message: removeError } } : { error: null };
          },
        }),
      },
    },
    removed,
  };
}

describe("purgeUserFiles", () => {
  it("collects paths across every table that cascades on the user", async () => {
    const { client, removed } = fakeAdmin({
      certificates: [{ pdf_path: "cert/1.pdf" }, { pdf_path: "cert/2.pdf" }],
      care_cert_observations: [{ evidence_path: "obs/1.jpg" }],
      care_cert_signoffs: [{ pdf_path: "obs/signoff.pdf" }],
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await purgeUserFiles(client as any, "u1");
    expect(res.removed).toBe(4);
    expect(res.failures).toEqual([]);
    expect(removed.map((r) => r.bucket).sort()).toEqual([
      "certificates",
      "observation-evidence",
    ]);
  });

  it("reports a storage failure instead of throwing, so deletion is never blocked", async () => {
    const { client } = fakeAdmin(
      { certificates: [{ pdf_path: "cert/1.pdf" }] },
      "bucket unavailable",
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await purgeUserFiles(client as any, "u1");
    expect(res.removed).toBe(0);
    expect(res.failures).toEqual([
      { bucket: "certificates", error: "bucket unavailable" },
    ]);
    // Still reported, so the audit log records what to clean up by hand.
    expect(res.found).toEqual([
      { bucket: "certificates", paths: ["cert/1.pdf"] },
    ]);
  });

  it("is a no-op for a user with no stored files", async () => {
    const { client, removed } = fakeAdmin({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await purgeUserFiles(client as any, "u1");
    expect(res).toEqual({ found: [], removed: 0, failures: [] });
    expect(removed).toEqual([]);
  });
});
