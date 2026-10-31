import React from "react";
import { interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { COLORS, EASE, MONO } from "../theme";
import { useFormat } from "../format";

export type ClockBeat = { f: number; time: string; tone: "neutral" | "bad" | "ok"; check?: boolean };

const toneColor = { neutral: COLORS.text, bad: COLORS.danger, ok: COLORS.success } as const;
const toneBorder = { neutral: COLORS.border, bad: COLORS.danger, ok: COLORS.success } as const;

/** Clock pill (the stakes meter). Each beat flips the time in over 8f; tone colors cross-fade. */
export const ClockPill: React.FC<{ beats: ClockBeat[]; opacity?: number; y?: number }> = ({
  beats,
  opacity = 1,
  y: yProp,
}) => {
  const frame = useCurrentFrame();
  const fmt = useFormat();
  const y = yProp ?? fmt.clockY;
  let idx = 0;
  for (let i = 0; i < beats.length; i++) if (frame >= beats[i].f) idx = i;
  const cur = beats[idx];
  const prev = beats[Math.max(0, idx - 1)];
  const flip = idx === 0 ? 1 : interpolate(frame, [cur.f, cur.f + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  const color = interpolateColors(flip, [0, 1], [toneColor[prev.tone], toneColor[cur.tone]]);
  const border = interpolateColors(flip, [0, 1], [toneBorder[prev.tone], toneBorder[cur.tone]]);
  // Pop on each change.
  const pop = idx === 0 ? 1 : interpolate(frame, [cur.f, cur.f + 4, cur.f + 16], [1, 1.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  // Fixed, readable icon hands. (True 4:48–4:51 hands point almost opposite each other and read as a "no" sign.)
  const minuteDeg = 0;
  const hourDeg = 120;

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 26px",
          borderRadius: 999,
          background: COLORS.bg,
          border: `2px solid ${border}`,
          boxShadow: cur.tone === "neutral" ? "none" : `0 0 ${24 * flip}px ${border}66`,
          fontFamily: MONO,
          fontSize: 40,
          color,
          transform: `scale(${pop})`,
        }}
      >
        <svg width={40} height={40} viewBox="-17 -17 34 34">
          <circle r={14} fill="none" stroke={color} strokeWidth={3} />
          <line x1={0} y1={0} x2={0} y2={-6} stroke={color} strokeWidth={3.2} strokeLinecap="round" transform={`rotate(${hourDeg})`} />
          <line x1={0} y1={0} x2={0} y2={-10.5} stroke={color} strokeWidth={2} strokeLinecap="round" transform={`rotate(${minuteDeg})`} />
          <circle r={2.4} fill={color} />
        </svg>
        <div style={{ position: "relative", overflow: "hidden", height: 48, lineHeight: "48px" }}>
          <div style={{ transform: `translateY(${(1 - flip) * 48}px)`, opacity: flip }}>{cur.time}</div>
          {idx > 0 && flip < 1 ? (
            <div style={{ position: "absolute", top: 0, transform: `translateY(${-flip * 48}px)`, opacity: 1 - flip }}>
              {prev.time}
            </div>
          ) : null}
        </div>
        {cur.check ? (
          <svg width={30} height={30} viewBox="0 0 20 20" style={{ opacity: flip, transform: `scale(${0.6 + 0.4 * flip})` }}>
            <path d="M4 10.5 L8.3 14.5 L16 5.5" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </div>
    </div>
  );
};
