"use client";

import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";

// Kept out of the component body so the linter doesn't flag Math.random as impure.
const rand = () => Math.random();

/** Detail carried by the `mca:award-stars` window event. */
export interface AwardStarsDetail {
  count: number;
  origin?: { x: number; y: number };
}

interface Flyer {
  id: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  delay: number;
  duration: number;
}

const EVENT = "mca:award-stars";
const GLYPH = "#f59e0b"; // amber-500

/**
 * Learner star-bank counter for the header. Shows the running total and, when a
 * star is earned anywhere in the app (assessment results or an in-content
 * question), animates that many stars flying from where they were earned into
 * this pill, ticking the count up as each one lands.
 *
 * Coordinated by a window CustomEvent (`mca:award-stars`) rather than React
 * context — matches the app's self-contained-component style (see confetti.tsx).
 */
export function StarBank({ initialTotal }: { initialTotal: number }) {
  const [total, setTotal] = useState(initialTotal);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [popping, setPopping] = useState(false);
  const pillRef = useRef<HTMLSpanElement>(null);
  const nextId = useRef(0);

  useEffect(() => {
    function pop() {
      setPopping(true);
      window.setTimeout(() => setPopping(false), 320);
    }

    function onAward(e: Event) {
      const detail = (e as CustomEvent<AwardStarsDetail>).detail;
      const count = Math.max(0, Math.floor(detail?.count ?? 0));
      if (count === 0) return;

      const target = pillRef.current?.getBoundingClientRect();
      // No target rect (e.g. hidden on mobile) → just tick the number up.
      if (!target) {
        setTotal((t) => t + count);
        pop();
        return;
      }
      const tx = target.left + target.width / 2;
      const ty = target.top + target.height / 2;
      const origin = detail?.origin ?? {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };

      const made: Flyer[] = [];
      for (let i = 0; i < count; i++) {
        const jitterX = (rand() - 0.5) * 80;
        const jitterY = (rand() - 0.5) * 40;
        const startX = origin.x + jitterX;
        const startY = origin.y + jitterY;
        const delay = i * 0.09 + rand() * 0.05;
        const duration = 0.85 + rand() * 0.35;
        const id = nextId.current++;
        made.push({ id, startX, startY, dx: tx - startX, dy: ty - startY, delay, duration });
        // Tick the count up and drop this flyer as it lands.
        window.setTimeout(
          () => {
            setTotal((t) => t + 1);
            pop();
            setFlyers((fs) => fs.filter((f) => f.id !== id));
          },
          (delay + duration) * 1000,
        );
      }
      setFlyers((fs) => [...fs, ...made]);
    }

    window.addEventListener(EVENT, onAward);
    return () => window.removeEventListener(EVENT, onAward);
  }, []);

  return (
    <>
      <span
        ref={pillRef}
        title={`${total} stars — 1 per correct answer, up to 20 per course assessment plus in-course questions`}
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700"
        style={popping ? { animation: "star-pop 0.32s ease-out" } : undefined}
        aria-label={`Star bank: ${total} stars`}
      >
        <Star className="size-4" fill={GLYPH} stroke={GLYPH} />
        {total}
      </span>

      {flyers.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
          {flyers.map((f) => (
            <span
              key={f.id}
              style={
                {
                  position: "fixed",
                  left: f.startX,
                  top: f.startY,
                  "--dx": `${f.dx}px`,
                  "--dy": `${f.dy}px`,
                  animation: `star-fly ${f.duration}s ${f.delay}s cubic-bezier(0.4, 0, 0.6, 1) forwards`,
                } as React.CSSProperties
              }
            >
              <Star className="size-5 drop-shadow" fill={GLYPH} stroke={GLYPH} />
            </span>
          ))}
        </div>
      )}
    </>
  );
}
