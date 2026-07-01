import type { SlideBlock as SlideBlockType } from "@/lib/content";

export function SlideBlock({ block }: { block: SlideBlockType }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">{block.title}</h2>
      <p className="text-base leading-7 text-muted-foreground whitespace-pre-line">
        {block.body}
      </p>
    </div>
  );
}
