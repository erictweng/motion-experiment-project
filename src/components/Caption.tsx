import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, DUR, INTER } from "../theme";
import { enterAt, exitAt } from "../anim";

/** Overlay caption, screen space, bottom-center. Must stay on screen ≥ DUR.read frames. */
export const Caption: React.FC<{ text: string; from: number; to: number; bottom?: number }> = ({
  text,
  from,
  to,
  bottom = 84,
}) => {
  const frame = useCurrentFrame();
  if (to - from < DUR.read) throw new Error(`Caption "${text}" is on screen ${to - from}f (< ${DUR.read}f)`);
  const p = enterAt(frame, from) * exitAt(frame, to - DUR.exit);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        textAlign: "center",
        fontFamily: INTER,
        fontWeight: 800,
        fontSize: 60,
        letterSpacing: -1.5,
        color: COLORS.text,
        opacity: Math.min(1, p),
        transform: `translateY(${(1 - p) * 24}px)`,
        textShadow: "0 4px 28px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,0.8)",
      }}
    >
      {text}
    </div>
  );
};
