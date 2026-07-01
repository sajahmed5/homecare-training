"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { TopicBadge } from "@/components/learner-ui";
import { cn } from "@/lib/utils";
import { topicTheme, tint } from "@/lib/topic-theme";
import { selfEnrolAction } from "@/app/learn/actions";

export interface CatalogueCourse {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
}

export function AllCourses({
  courses,
  enrolledIds,
}: {
  courses: CatalogueCourse[];
  enrolledIds: string[];
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(new Set(enrolledIds));
  const [busy, setBusy] = useState<string | null>(null);

  const topics = [...new Set(courses.map((c) => c.topic).filter(Boolean))] as string[];

  const filtered = courses.filter((c) => {
    if (topic && c.topic !== topic) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    );
  });

  async function enrol(id: string) {
    setBusy(id);
    const res = await selfEnrolAction(id);
    setBusy(null);
    if (res.ok) setEnrolled((prev) => new Set(prev).add(id));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search courses…"
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTopic(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              topic === null ? "bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            All
          </button>
          {topics.map((t) => {
            const theme = topicTheme(t);
            const active = topic === t;
            return (
              <button
                key={t}
                onClick={() => setTopic(active ? null : t)}
                className="rounded-full border px-3 py-1 text-xs font-medium"
                style={
                  active
                    ? { backgroundColor: theme.color, color: "white", borderColor: theme.color }
                    : { backgroundColor: tint(theme.color), color: theme.color, borderColor: "transparent" }
                }
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const isEnrolled = enrolled.has(c.id);
          return (
            <div
              key={c.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm"
            >
              <div className="space-y-2">
                <TopicBadge topic={c.topic} />
                <p className="font-semibold leading-snug">{c.title}</p>
                {c.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                )}
              </div>
              {isEnrolled ? (
                <Link
                  href={`/learn/courses/${c.id}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Go to course
                </Link>
              ) : (
                <Button
                  size="sm"
                  onClick={() => enrol(c.id)}
                  disabled={busy === c.id}
                >
                  {busy === c.id ? "Enrolling…" : "Enrol"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No courses match.</p>
      )}
    </div>
  );
}
