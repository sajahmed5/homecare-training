export interface LearnerStats {
  assigned: number;
  completed: number;
  certificates: number;
  overdue: number;
  inductionTotal: number;
  inductionCompleted: number;
}

export interface Badge {
  key: string;
  label: string;
  description: string;
  earned: boolean;
}

/** Milestone badges derived from a learner's stats. Pure. */
export function computeBadges(s: LearnerStats): Badge[] {
  return [
    {
      key: "first_pass",
      label: "First pass",
      description: "Passed your first course",
      earned: s.certificates >= 1,
    },
    {
      key: "five_done",
      label: "High five",
      description: "Completed 5 courses",
      earned: s.completed >= 5,
    },
    {
      key: "compliant",
      label: "Fully compliant",
      description: "No overdue training",
      earned: s.assigned > 0 && s.overdue === 0 && s.completed >= s.assigned,
    },
    {
      key: "induction",
      label: "Care Certificate",
      description: "Completed all 16 Care Certificate standards",
      earned:
        s.inductionTotal > 0 && s.inductionCompleted >= s.inductionTotal,
    },
  ];
}

/**
 * Learning streak — consecutive days (ending today or yesterday) on which the
 * learner completed activity. Pure.
 */
export function computeStreak(activityDates: Date[], now: Date): number {
  const days = new Set(
    activityDates.map((d) => d.toISOString().slice(0, 10)),
  );
  if (days.size === 0) return 0;

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date(now);
  const yesterday = new Date(now.getTime() - 86_400_000);

  // Streak only counts if there was activity today or yesterday.
  let cursor: Date;
  if (days.has(dayKey(today))) cursor = today;
  else if (days.has(dayKey(yesterday))) cursor = yesterday;
  else return 0;

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}
