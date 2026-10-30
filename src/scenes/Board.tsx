import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, DUR, EASE, INTER, MONO } from "../theme";

// Animatic placeholder: shows the storyboard beat until the real scene is built.
export const Board: React.FC<{
  index: number;
  title: string;
  timecode: string;
  beats: string[];
  copy: string;
}> = ({ index, title, timecode, beats, copy }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const enter = (delay: number) =>
    interpolate(frame - delay, [0, DUR.enter], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE.enter,
    });
  const exit = interpolate(
    frame,
    [durationInFrames - DUR.exit, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.exit },
  );
  // Camera never fully stops: slow drift across the whole scene.
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.03], {
    easing: EASE.inOut,
  });

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
      <div style={{ width: 1400, transform: `scale(${drift})`, opacity: exit }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 28,
            color: COLORS.accent,
            opacity: enter(0),
          }}
        >
          SCENE {index} · {timecode}
        </div>
        <div
          style={{
            fontSize: 110,
            fontWeight: 800,
            letterSpacing: -3,
            opacity: enter(4),
            transform: `translateY(${(1 - enter(4)) * 40}px)`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 600,
            color: COLORS.muted,
            margin: "12px 0 48px",
            opacity: enter(8),
          }}
        >
          “{copy}”
        </div>
        {beats.map((b, i) => {
          const p = enter(16 + i * DUR.stagger * 2);
          return (
            <div
              key={b}
              style={{
                fontSize: 32,
                padding: "18px 28px",
                marginBottom: 14,
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                opacity: p,
                transform: `translateX(${(1 - p) * -60}px)`,
              }}
            >
              {b}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
