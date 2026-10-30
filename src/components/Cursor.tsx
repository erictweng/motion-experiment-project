import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, DUR, EASE } from "../theme";
import { inOutAt } from "../anim";

export type CursorKey = {
  f: number;
  x: number;
  y: number;
  /** Arc bend for the move INTO this key: fraction of distance, sign picks the side. */
  arc?: number;
};

type Pt = { x: number; y: number };

/** Position on quadratic-bezier arcs between keys (eased inOut per segment). */
export const cursorPos = (frame: number, keys: CursorKey[]): Pt => {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (frame >= b.f) continue;
    const t = inOutAt(frame, a.f, b.f);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const bend = b.arc ?? 0.28;
    // Perpendicular offset → control point (arcs, never straight lines).
    const cx = mx - dy * bend;
    const cy = my + dx * bend;
    const u = 1 - t;
    return {
      x: u * u * a.x + 2 * u * t * cx + t * t * b.x,
      y: u * u * a.y + 2 * u * t * cy + t * t * b.y,
    };
  }
  return keys[keys.length - 1];
};

const ARROW = "M0 0 L0 30 L7.5 23 L12.5 34.5 L17.5 32.5 L12.5 21.5 L22 21.5 Z";

export const CursorGlyph: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <svg width={40} height={56} viewBox="-2 -2 28 40" style={{ overflow: "visible", opacity }}>
    <path d={ARROW} fill="#FFFFFF" stroke="#0B0D12" strokeWidth={1.6} strokeLinejoin="round" />
  </svg>
);

/**
 * Cursor in world space. Moves on arcs, press = scale 0.96 over 3f + a ring.
 * `wobble` adds a small deterministic jitter inside [from, to] (the "where was I?" hesitation).
 */
export const Cursor: React.FC<{
  keys: CursorKey[];
  clicks: number[];
  wobble?: { from: number; to: number }[];
  ghosts?: { x: number; y: number; from: number; to: number }[];
  appear?: number;
  /** Frame to start fading out (10f). */
  vanish?: number;
}> = ({ keys, clicks, wobble = [], ghosts = [], appear = keys[0].f, vanish = Infinity }) => {
  const frame = useCurrentFrame();
  const p = cursorPos(frame, keys);
  let wx = 0;
  let wy = 0;
  for (const w of wobble) {
    if (frame >= w.from && frame <= w.to) {
      const env = Math.sin(((frame - w.from) / (w.to - w.from)) * Math.PI);
      wx += 6 * env * Math.sin((frame - w.from) / 3.1);
      wy += 3 * env * Math.sin((frame - w.from) / 4.3 + 1);
    }
  }

  let press = 1;
  let ring = 0;
  let ringT = -1;
  for (const c of clicks) {
    const d = frame - c;
    if (d >= 0 && d < DUR.press * 2) {
      press = d < DUR.press
        ? interpolate(d, [0, DUR.press], [1, 0.96], { easing: EASE.inOut })
        : interpolate(d, [DUR.press, DUR.press * 2], [0.96, 1], { easing: EASE.out });
    }
    if (d >= 0 && d < 20) {
      ringT = d / 20;
      ring = 1;
    }
  }
  const appearO =
    interpolate(frame, [appear, appear + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out }) *
    (Number.isFinite(vanish)
      ? interpolate(frame, [vanish, vanish + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.exit })
      : 1);
  if (appearO <= 0 && frame > appear) return null;

  return (
    <>
      {ghosts.map((g, i) => {
        const o = interpolate(frame, [g.from, g.from + 6, g.to - 10, g.to], [0, 0.35, 0.35, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={i} style={{ position: "absolute", left: g.x, top: g.y, opacity: o }}>
            <CursorGlyph />
          </div>
        );
      })}
      {ring > 0 ? (
        <div
          style={{
            position: "absolute",
            left: p.x + wx - 30,
            top: p.y + wy - 30,
            width: 60,
            height: 60,
            borderRadius: 999,
            border: `3px solid ${COLORS.text}`,
            opacity: (1 - ringT) * 0.7,
            transform: `scale(${0.3 + EASE.out(ringT) * 0.9})`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: p.x + wx,
          top: p.y + wy,
          opacity: appearO,
          transform: `scale(${press})`,
          transformOrigin: "0 0",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))",
        }}
      >
        <CursorGlyph />
      </div>
    </>
  );
};
