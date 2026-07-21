"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  REQUIRED_DOCS,
  CANDIDATE_STAGES,
  CANDIDATE_STATUSES,
} from "@/lib/recruitment";
import {
  updateCandidateAction,
  uploadDocumentAction,
  deleteDocumentAction,
  deleteCandidateAction,
  hireCandidateAction,
  getDocUrlAction,
} from "../actions";

const selectClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

export interface Candidate {
  id: string;
  full_name: string;
  email: string | null;
  stage: string;
  status: string;
}
export interface Doc {
  id: string;
  doc_type: string;
  file_name: string | null;
  file_path: string;
  expires_at: string | null;
}

function readFile(file: File): Promise<{ name: string; dataUrl: string }> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: file.name, dataUrl: String(r.result) });
    r.readAsDataURL(file);
  });
}

function DocRow({
  candidateId,
  docKey,
  label,
  tracksExpiry,
  existing,
  onChange,
}: {
  candidateId: string;
  docKey: string;
  label: string;
  tracksExpiry?: boolean;
  existing?: Doc;
  onChange: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [expires, setExpires] = useState(existing?.expires_at ?? "");
  const [busy, setBusy] = useState(false);

  const expired =
    existing?.expires_at && new Date(existing.expires_at) < new Date();

  async function upload() {
    if (!file) return;
    setBusy(true);
    const payload = await readFile(file);
    await uploadDocumentAction(candidateId, docKey, payload, expires || null);
    setBusy(false);
    setFile(null);
    onChange();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-40">
        <p className="text-sm font-medium">{label}</p>
        {existing ? (
          <p className="text-xs text-muted-foreground">
            {existing.file_name}
            {existing.expires_at && (
              <span className={expired ? "text-destructive" : ""}>
                {" "}
                · expires{" "}
                {new Date(existing.expires_at).toLocaleDateString("en-GB")}
              </span>
            )}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Not uploaded</p>
        )}
      </div>

      {existing ? (
        <div className="flex gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={async () => {
              const { url } = await getDocUrlAction(existing.file_path);
              if (url) window.open(url, "_blank");
            }}
          >
            View
          </Button>
          <Button
            size="xs"
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await deleteDocumentAction(existing.id, candidateId);
              onChange();
            }}
          >
            Remove
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {tracksExpiry && (
            <Input
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="h-8 w-36"
              title="Expiry date"
            />
          )}
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="h-8 w-48 text-xs"
          />
          <Button size="xs" onClick={upload} disabled={busy || !file}>
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}

export function CandidateDetail({
  candidate,
  documents,
}: {
  candidate: Candidate;
  documents: Doc[];
}) {
  const router = useRouter();
  const [stage, setStage] = useState(candidate.stage);
  const [status, setStatus] = useState(candidate.status);
  const [createLearner, setCreateLearner] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const byType = new Map(documents.map((d) => [d.doc_type, d]));

  async function saveMeta() {
    setBusy(true);
    await updateCandidateAction(candidate.id, { stage, status });
    setBusy(false);
    router.refresh();
  }

  async function hire() {
    setBusy(true);
    const r = await hireCandidateAction(candidate.id, createLearner);
    setBusy(false);
    setStatus("hired");
    setMsg(
      r.invited
        ? "Marked hired and invited as a learner. Assign their courses from the Team page."
        : "Marked hired.",
    );
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Stage</Label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className={selectClass}
          >
            {CANDIDATE_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
          >
            {CANDIDATE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={saveMeta} disabled={busy}>
          Save
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Documents</p>
        <div className="grid gap-2">
          {REQUIRED_DOCS.map((d) => (
            <DocRow
              key={d.key}
              candidateId={candidate.id}
              docKey={d.key}
              label={d.label}
              tracksExpiry={d.tracksExpiry}
              existing={byType.get(d.key)}
              onChange={() => router.refresh()}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createLearner}
              onChange={(e) => setCreateLearner(e.target.checked)}
            />
            Also create as a learner (assign courses separately)
          </label>
        </div>
        <Button onClick={hire} disabled={busy || status === "hired"}>
          Mark hired
        </Button>
        {msg && (
          <span className="text-sm text-green-700 dark:text-green-500">
            {msg}
          </span>
        )}
      </div>

      <form
        action={deleteCandidateAction.bind(null, candidate.id)}
        className="pt-2"
      >
        <Button type="submit" variant="destructive" size="sm">
          Delete candidate
        </Button>
      </form>
    </div>
  );
}
