"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isFieldVisible, type FormField } from "@/lib/forms";
import { submitFormAction } from "../../actions";
import { SignaturePad } from "./signature-pad";

const inputClass =
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm";

export function FormFill({
  formId,
  fields,
}: {
  formId: string;
  fields: FormField[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<
    Record<string, { name: string; dataUrl: string }>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const visible = fields.filter((f) => isFieldVisible(f, values));

  function set(id: string, value: unknown) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  function onFile(id: string, file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFiles((prev) => ({
        ...prev,
        [id]: { name: file.name, dataUrl: String(reader.result) },
      }));
      set(id, file.name);
    };
    reader.readAsDataURL(file);
  }

  async function submit() {
    setError(null);
    for (const f of visible) {
      if (!f.required) continue;
      const v = values[f.id];
      const empty =
        v === undefined ||
        v === "" ||
        (Array.isArray(v) && v.length === 0) ||
        (f.type === "file" && !files[f.id]);
      if (empty) {
        setError(`Please complete: ${f.label}`);
        return;
      }
    }

    setBusy(true);
    const res = await submitFormAction(formId, values, files);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not submit.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold">Thank you</h2>
        <p className="text-muted-foreground">Your response has been recorded.</p>
        <Button onClick={() => router.push("/org/forms")}>Back to forms</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visible.map((f) => (
        <div key={f.id} className="space-y-2">
          <Label>
            {f.label}
            {f.required && <span className="text-destructive"> *</span>}
          </Label>

          {(f.type === "text" || f.type === "number" || f.type === "date") && (
            <Input
              type={f.type === "text" ? "text" : f.type}
              value={(values[f.id] as string) ?? ""}
              onChange={(e) => set(f.id, e.target.value)}
            />
          )}

          {f.type === "textarea" && (
            <textarea
              className={`${inputClass} h-24 py-2`}
              value={(values[f.id] as string) ?? ""}
              onChange={(e) => set(f.id, e.target.value)}
            />
          )}

          {f.type === "select" && (
            <select
              className={inputClass}
              value={(values[f.id] as string) ?? ""}
              onChange={(e) => set(f.id, e.target.value)}
            >
              <option value="">Choose…</option>
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}

          {f.type === "radio" && (
            <div className="space-y-1">
              {f.options.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={f.id}
                    checked={values[f.id] === o}
                    onChange={() => set(f.id, o)}
                  />
                  {o}
                </label>
              ))}
            </div>
          )}

          {f.type === "checkbox" && (
            <div className="space-y-1">
              {f.options.map((o) => {
                const arr = (values[f.id] as string[]) ?? [];
                return (
                  <label key={o} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={arr.includes(o)}
                      onChange={(e) =>
                        set(
                          f.id,
                          e.target.checked
                            ? [...arr, o]
                            : arr.filter((x) => x !== o),
                        )
                      }
                    />
                    {o}
                  </label>
                );
              })}
            </div>
          )}

          {f.type === "file" && (
            <Input
              type="file"
              onChange={(e) => onFile(f.id, e.target.files?.[0])}
            />
          )}

          {f.type === "signature" && (
            <SignaturePad onChange={(url) => set(f.id, url)} />
          )}
        </div>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={submit} disabled={busy}>
        {busy ? "Submitting…" : "Submit"}
      </Button>
    </div>
  );
}
