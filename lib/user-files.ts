import type { SupabaseClient } from "@supabase/supabase-js";

/** A bucket and the object paths belonging to one user inside it. */
export interface BucketFiles {
  bucket: string;
  paths: string[];
}

export interface PurgeResult {
  /** Everything found, whether or not removal succeeded — the audit trail. */
  found: BucketFiles[];
  removed: number;
  failures: { bucket: string; error: string }[];
}

/**
 * Where a user's stored files live, and the row that points at each. Every one
 * of these tables cascades on users.id, so the row is gone the instant the
 * account is deleted — taking the only record of the file path with it. The
 * file itself stays in the bucket forever, unreachable and unattributable.
 *
 * Buckets deliberately absent: form-uploads and issue-screenshots hang off rows
 * whose user reference is SET NULL, so those rows (and the path) survive the
 * deletion and the file is still accounted for. candidate-docs belongs to
 * recruitment candidates, who are not users.
 */
const SOURCES: { table: string; column: string; bucket: string }[] = [
  { table: "certificates", column: "pdf_path", bucket: "certificates" },
  {
    table: "care_cert_observations",
    column: "evidence_path",
    bucket: "observation-evidence",
  },
  {
    table: "care_cert_signoffs",
    column: "pdf_path",
    bucket: "observation-evidence",
  },
];

/** Collapse the per-table findings into one list of paths per bucket. */
export function groupByBucket(
  entries: { bucket: string; path: string }[],
): BucketFiles[] {
  const byBucket = new Map<string, Set<string>>();
  for (const e of entries) {
    if (!e.path) continue;
    const set = byBucket.get(e.bucket) ?? new Set<string>();
    set.add(e.path);
    byBucket.set(e.bucket, set);
  }
  return [...byBucket.entries()].map(([bucket, paths]) => ({
    bucket,
    paths: [...paths],
  }));
}

/**
 * Delete a user's stored files. MUST run before the auth user is deleted:
 * afterwards the rows naming these paths no longer exist.
 *
 * Never throws and never blocks the deletion — an erasure request shouldn't
 * fail because storage is having a bad day. Anything it couldn't remove comes
 * back in `failures`, and callers record `found` in the audit log so a human
 * can finish the job by hand.
 */
export async function purgeUserFiles(
  admin: SupabaseClient,
  userId: string,
): Promise<PurgeResult> {
  const entries: { bucket: string; path: string }[] = [];
  for (const src of SOURCES) {
    const { data } = await admin
      .from(src.table)
      .select(src.column)
      .eq("user_id", userId);
    for (const row of data ?? []) {
      const path = (row as unknown as Record<string, unknown>)[src.column];
      if (typeof path === "string" && path) {
        entries.push({ bucket: src.bucket, path });
      }
    }
  }

  const found = groupByBucket(entries);
  let removed = 0;
  const failures: { bucket: string; error: string }[] = [];

  for (const { bucket, paths } of found) {
    const { error } = await admin.storage.from(bucket).remove(paths);
    if (error) failures.push({ bucket, error: error.message });
    else removed += paths.length;
  }

  return { found, removed, failures };
}
