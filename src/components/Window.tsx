import React from "react";
import { COLORS, INTER, THIRD } from "../theme";

/** Generic app-window chrome (stylized look-alike: traffic dots + a title, no brand marks). */
export const Window: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  border?: string;
  bodyBg?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ x, y, w, h, title, border = COLORS.border, bodyBg = COLORS.surface, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      borderRadius: 16,
      border: `2px solid ${border}`,
      background: bodyBg,
      overflow: "hidden",
      boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
      fontFamily: INTER,
      ...style,
    }}
  >
    <div
      style={{
        height: 48,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 20px",
        background: THIRD.windowBar,
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <div key={c} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />
      ))}
      <div style={{ marginLeft: 14, fontSize: 18, fontWeight: 600, color: COLORS.muted }}>{title}</div>
    </div>
    {children}
  </div>
);
