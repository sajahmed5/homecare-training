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

export type ContentBlock =
  | SlideBlock
  | McqBlock
  | FillGapBlock
  | DragDropBlock;

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
  }
}

/** Coerce unknown jsonb into a ContentBlock[] (tolerant of bad data). */
export function parseBlocks(value: unknown): ContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (b): b is ContentBlock =>
      !!b &&
      typeof b === "object" &&
      "type" in b &&
      ["slide", "mcq", "fill_gap", "drag_drop"].includes(
        (b as { type: string }).type,
      ),
  );
}
