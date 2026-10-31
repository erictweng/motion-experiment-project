import React from "react";
import { BRAND, COLORS } from "../theme";

/** Patchnote mark, built in code: accent tile with a "patch" diamond (white, or dark on a light accent) and a stitch line. */
export const LogoMark: React.FC<{ size?: number; glow?: number }> = ({ size = 40, glow = 0 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    style={{ filter: glow > 0 ? `drop-shadow(0 0 ${glow}px ${COLORS.accent})` : undefined }}
  >
    <rect width={40} height={40} rx={10} fill={COLORS.accent} />
    <rect x={11} y={11} width={18} height={18} rx={4} fill="none" stroke={BRAND.on} strokeWidth={3.2} transform="rotate(45 20 20)" />
    <path d="M15.5 24.5 L24.5 15.5" stroke={BRAND.on} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="2.2 3" />
  </svg>
);
