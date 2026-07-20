// Course content is stored as an ordered array of typed blocks (courses.content_blocks
// jsonb). This is the pluggable content interface: add a new block type here + a
// renderer in components/content, and it's playable — no engine to host.

export interface SlideBlock {
  type: "slide";
  title: string;
  body: string;
}

export interface McqBlock {
  type: "mcq";
  question: string;
  options: string[];
  answerIndex: number;
}

export interface FillGapBlock {
  type: "fill_gap";
  /** Use ___ to mark the gap. */
  text: string;
  /** Accepted answers (case-insensitive). */
  answers: string[];
}

export interface DragDropBlock {
  type: "drag_drop";
  prompt: string;
  pairs: { item: string; match: string }[];
}

/**
 * An H5P interactive package played by the client-side h5p-standalone player.
 * `path` is the folder under /public/h5p/content (e.g. "communication-skills"),
 * which holds h5p.json + content/content.json; libraries are shared from
 * /public/h5p/libraries.
 */
export interface H5PBlock {
  type: "h5p";
  path: string;
  /** Optional friendly name for the interaction (defaults to "Interactive"). */
  label?: string;
  /**
   * Number of gradeable questions on this page (MCQ / drag-text / true-false).
   * The player requires all of them to be answered before allowing "Next".
   */
  questions?: number;
  /**
   * Section this page belongs to. Consecutive pages sharing a section are
   * grouped in the contents panel so learners can see what they have covered
   * and what is left. Pages without one fall into a single unnamed section.
   */
  section?: string;
}

export interface CourseSection {
  title: string;
  /** Index of the first page in this section. */
  start: number;
  /** Page indexes belonging to this section, in order. */
  pages: number[];
}

/**
 * Group consecutive pages by their `section`. Consecutive rather than by name
 * so a section title reused later in a course produces two separate blocks
 * rather than one impossible non-contiguous group.
 */
export function groupSections(pages: H5PBlock[]): CourseSection[] {
  const sections: CourseSection[] = [];
  pages.forEach((page, i) => {
    const title = page.section?.trim() || "Course content";
    const last = sections[sections.length - 1];
    if (last && last.title === title) last.pages.push(i);
    else sections.push({ title, start: i, pages: [i] });
  });
  return sections;
}

export type ContentBlock =
  | SlideBlock
  | McqBlock
  | FillGapBlock
  | DragDropBlock
  | H5PBlock;

/** True for blocks that require learner interaction (formative, not graded). */
export function isInteractive(block: ContentBlock): boolean {
  return block.type !== "slide";
}

export function blockLabel(block: ContentBlock): string {
  switch (block.type) {
    case "slide":
      return "Slide";
    case "mcq":
      return "Knowledge check";
    case "fill_gap":
      return "Fill the gap";
    case "drag_drop":
      return "Match the pairs";
    case "h5p":
      return block.label ?? "Interactive";
  }
}

const BLOCK_TYPES = ["slide", "mcq", "fill_gap", "drag_drop", "h5p"];

/** Coerce unknown jsonb into a ContentBlock[] (tolerant of bad data). */
export function parseBlocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (b): b is ContentBlock =>
      !!b &&
      typeof b === "object" &&
      "type" in b &&
      BLOCK_TYPES.includes((b as { type: string }).type),
  );
}

/**
 * A course delivered entirely as H5P pages (one or more H5P packages, played
 * one per screen). Returns the ordered pages, or null if the course mixes in
 * native blocks.
 */
export function allH5P(blocks: ContentBlock[]): H5PBlock[] | null {
  if (blocks.length > 0 && blocks.every((b) => b.type === "h5p")) {
    return blocks as H5PBlock[];
  }
  return null;
}
