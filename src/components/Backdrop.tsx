import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/**
 * Ambient depth behind a scene: two or three large, soft color fields drifting slowly
 * (deterministic sine motion, never static). Sits between the scene background and its content.
 */
export const Backdrop: React.FC<{
  tones: { color: string; x: number; y: number; r: number; opacity: number; phase: number }[];
  /** Drift amplitude in px. */
  drift?: number;
  /** Add the scene's start frame so drift is continuous across scenes that share tones. */
  frameOffset?: number;
}> = ({ tones, drift = 90, frameOffset = 0 }) => {
  const frame = useCurrentFrame() + frameOffset;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {tones.map((t, i) => {
        const dx = drift * Math.sin(frame / 150 + t.phase);
        const dy = drift * 0.6 * Math.cos(frame / 190 + t.phase * 1.3);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: t.x - t.r + dx,
              top: t.y - t.r + dy,
              width: t.r * 2,
              height: t.r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${t.color} 0%, transparent 68%)`,
              opacity: t.opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Edge darkening over the whole frame. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.42 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

/** Fine film grain. Seeded per frame (deterministic), very low opacity. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  const frame = useCurrentFrame();
  const seed = frame % 24; // repeats every 24f; deterministic
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity, mixBlendMode: "overlay" }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
