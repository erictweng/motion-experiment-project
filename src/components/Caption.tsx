import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, DUR, INTER } from "../theme";
import { useFormat } from "../format";
import { enterAt, exitAt } from "../anim";

/** Overlay caption, screen space, bottom-center. Must stay on screen ≥ DUR.read frames. */
export const Caption: React.FC<{ text: string; from: number; to: number; bottom?: number }> = ({
  text,
  from,
  to,
  bottom: bottomProp,
}) => {
  const frame = useCurrentFrame();
  const fmt = useFormat();
  const bottom = bottomProp ?? fmt.captionBottom;
  if (to - from < DUR.read) throw new Error(`Caption "${text}" is on screen ${to - from}f (< ${DUR.read}f)`);
  const p = enterAt(frame, from) * exitAt(frame, to - DUR.exit);
  return (
    <div
      style={{
        position: "absolute",
        left: (fmt.W - fmt.captionMaxW) / 2,
        right: (fmt.W - fmt.captionMaxW) / 2,
        ...(fmt.captionTop !== undefined && bottomProp === undefined ? { top: fmt.captionTop } : { bottom }),
        textAlign: "center",
        textWrap: "balance",
        lineHeight: fmt.id === "wide" ? undefined : 1.12, // wide keeps its original single-line metrics
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
