import type { ContentBlock } from "@/lib/content";
import { SlideBlock } from "./slide-block";
import { McqBlock } from "./mcq-block";
import { FillGapBlock } from "./fill-gap-block";
import { MatchBlock } from "./match-block";

/** Pluggable registry: maps a content block to its renderer. */
export function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "slide":
      return <SlideBlock block={block} />;
    case "mcq":
      return <McqBlock block={block} />;
    case "fill_gap":
      return <FillGapBlock block={block} />;
    case "drag_drop":
      return <MatchBlock block={block} />;
    default:
      return null;
  }
}
