import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { TopicBadge } from "@/components/learner-ui";
import { topicTheme } from "@/lib/topic-theme";

export interface CourseCardData {
  courseId: string;
  title: string;
  topic: string | null;
  status?: string;
  progress?: number;
  dueDate?: string | null;
}

export function CourseCard({ c }: { c: CourseCardData }) {
  const theme = topicTheme(c.topic);
  const status = c.status;
  const progress = c.progress ?? 0;

  const cta =
    status === "completed"
      ? "Review"
      : status === "expired"
        ? "Redo"
        : progress > 0
          ? "Resume"
          : "Start";

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="space-y-2">
        <TopicBadge topic={c.topic} />
        <p className="font-semibold leading-snug">{c.title}</p>
      </div>

      {status && status !== "not_started" && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, backgroundColor: theme.color }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      )}

      {c.dueDate && (
        <p className="text-xs text-muted-foreground">
          Due {new Date(c.dueDate).toLocaleDateString("en-GB")}
        </p>
      )}

      <div className="flex gap-2">
        <Link
          href={`/learn/courses/${c.courseId}`}
          className={buttonVariants({ size: "sm", className: "flex-1" })}
        >
          {cta}
        </Link>
        <Link
          href={`/learn/courses/${c.courseId}/quiz`}
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          Assessment
        </Link>
      </div>
    </div>
  );
}
