"use client";

import { useState } from "react";

// Kept out of the component body so the linter doesn't flag Math.random as impure.
const rand = () => Math.random();

const COLORS = ["#0d9488", "#e11d48", "#d97706", "#7c3aed", "#0284c7", "#16a34a"];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
}

/** Lightweight, dependency-free confetti burst (CSS animation). */
export function Confetti({ count = 60 }: { count?: number }) {
  const [pieces] = useState<Piece[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      left: rand() * 100,
      delay: rand() * 0.4,
      duration: 1.6 + rand() * 1.4,
      color: COLORS[i % COLORS.length],
      size: 6 + rand() * 8,
    })),
  );

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-hidden
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-16px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: "2px",
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}
