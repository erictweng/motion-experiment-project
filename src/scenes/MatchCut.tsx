import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, EASE, HANDOFF, INTER, SCENES, STATS } from "../theme";

// 1D match cut: the Hook's big "47" shrinks and arcs into the "47 Merged" badge (14f), then hands off.
// Runs in its own Sequence from (hook end − HANDOFF.matchCut). Frame 0 is pixel-identical to the Hook counter.

/** Hook counter center on screen at the handoff frame (measured from render). */
const FROM = { x: 959, y: 500 };
/** Badge digits center on screen at Scene 2 local 0 (measured from render). */
export const BADGE_TARGET = { x: 290, y: 245.5 };
const HOOK_FONT = 360;
const BADGE_FONT = 22;

const SHUTTER = 0.5; // 180° shutter, as a fraction of a frame
const BLUR_SAMPLES = [0.3, 0.26, 0.22, 0.18, 0.14, 0.1, 0.07, 0.04];

export const MatchCut: React.FC = () => {
  const t = useCurrentFrame();
  const dur = HANDOFF.matchCut;
  // Hook push scale at the handoff frame, so frame 0 matches the Hook exactly.
  const handoff = SCENES.hook.duration - dur;
  const push = interpolate(handoff, [0, SCENES.hook.duration], [1, 1.04], { easing: EASE.inOut });
  const startSize = HOOK_FONT * push;

  const pose = (f: number) => {
    const p = interpolate(f, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
    // Scale geometrically so the shrink reads evenly.
    const k = Math.exp(interpolate(p, [0, 1], [0, Math.log(BADGE_FONT / startSize)]));
    // Quadratic arc: up and over into the badge.
    const ctrl = { x: (FROM.x + BADGE_TARGET.x) / 2 + 140, y: Math.min(FROM.y, BADGE_TARGET.y) - 150 };
    const u = 1 - p;
    return {
      p,
      k,
      x: u * u * FROM.x + 2 * u * p * ctrl.x + p * p * BADGE_TARGET.x,
      y: u * u * FROM.y + 2 * u * p * ctrl.y + p * p * BADGE_TARGET.y,
    };
  };

  const fade = interpolate(t, [dur, dur + 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  if (fade <= 0) return null;
  const now = pose(t);
  const trail = t > 0 && t < dur ? BLUR_SAMPLES.map((o, i) => ({ ...pose(t - (SHUTTER * (i + 1)) / BLUR_SAMPLES.length), o })) : [];

  const glyph = (q: ReturnType<typeof pose>, opacity: number, glow: boolean, key: string, blurPx = 0) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: q.x,
        top: q.y,
        transform: `translate(-50%, -50%) scale(${push * q.k})`,
        fontFamily: INTER,
        fontSize: HOOK_FONT,
        fontWeight: 800,
        letterSpacing: interpolate(q.p, [0, 1], [-12, 0]),
        lineHeight: 1,
        color: COLORS.text,
        fontVariantNumeric: "tabular-nums",
        textShadow: glow ? `0 0 ${80 * (1 - q.p)}px ${COLORS.accent}` : "none",
        opacity,
        filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {STATS.merged}
    </div>
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Blur scales with the glyph so the trail stays soft at every size. */}
      {trail.reverse().map((q, i) => glyph(q, q.o * fade, false, `trail${i}`, 4 / (push * q.k)))}
      {glyph(now, fade, true, "now")}
    </AbsoluteFill>
  );
};
