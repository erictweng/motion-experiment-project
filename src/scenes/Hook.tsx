import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, COPY, DUR, EASE, HANDOFF, INTER, MONO, SCENES, STATS } from "../theme";

// Scene 1 — HOOK (built for real; frames 0–240 local)
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

  const count = Math.round(
    interpolate(frame, [10, 70], [0, STATS.merged], { ...clamp, easing: EASE.out }),
  );
  // 1D match cut: from here the MatchCut overlay owns the number and flies it into the badge.
  const handoff = SCENES.hook.duration - HANDOFF.matchCut;
  // Label + pill clear just before the window fades up (label is on screen 76→~226, well over 90f).
  const out = interpolate(frame, [handoff - 6, handoff + 2], [1, 0], { ...clamp, easing: EASE.out });
  const glow = interpolate(frame, [10, 80], [0, 1], { ...clamp, easing: EASE.out });
  const label = interpolate(frame, [76, 76 + DUR.enter], [0, 1], {
    ...clamp,
    easing: EASE.enter,
  });
  const pill = interpolate(frame, [190, 190 + DUR.enter], [0, 1], {
    ...clamp,
    easing: EASE.enter,
  });
  const blink = frame > 215 ? 0.55 + 0.45 * Math.cos((frame - 215) / 4) : 1;
  const push = interpolate(frame, [0, 240], [1, 1.04], { easing: EASE.inOut });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: INTER,
        color: COLORS.text,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ transform: `scale(${push})`, textAlign: "center" }}>
        <div
          style={{
            fontSize: 360,
            fontWeight: 800,
            letterSpacing: -12,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            textShadow: `0 0 ${80 * glow}px ${COLORS.accent}`,
            opacity: frame >= handoff ? 0 : 1,
          }}
        >
          {count}
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 600,
            color: COLORS.muted,
            opacity: label * out,
            transform: `translateY(${(1 - label) * 24}px)`,
          }}
        >
          {COPY.hook.label}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 140,
          fontFamily: MONO,
          fontSize: 30,
          padding: "14px 28px",
          borderRadius: 999,
          border: `2px solid ${COLORS.danger}`,
          color: COLORS.danger,
          opacity: pill * blink * out,
          transform: `translateY(${(1 - pill) * 80}px)`,
        }}
      >
        {COPY.hook.deadline}
      </div>
    </AbsoluteFill>
  );
};
