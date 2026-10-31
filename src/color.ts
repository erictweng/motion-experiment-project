// Color math for brand tokens, so every tint, glow and companion color derives from one accent.
// Pure functions (no Remotion imports) so theme.ts can use them at module load.

type RGB = { r: number; g: number; b: number };

export const hexToRgb = (hex: string): RGB => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Expected a #RRGGBB color, got "${hex}"`);
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export const rgbToHex = ({ r, g, b }: RGB): string =>
  "#" + [r, g, b].map((v) => clamp255(v).toString(16).padStart(2, "0")).join("").toUpperCase();

/** `rgba(r,g,b,a)` string for a hex color. */
export const alpha = (hex: string, a: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};

/** Mix a color toward white by t (0 = unchanged, 1 = white). For light text and highlights on dark UI. */
export const tint = (hex: string, t: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r + (255 - r) * t, g: g + (255 - g) * t, b: b + (255 - b) * t });
};

const rgbToHsl = ({ r, g, b }: RGB) => {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
};

const hslToRgb = ({ h, s, l }: { h: number; s: number; l: number }): RGB => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
};

/** Rotate hue by `dh` degrees and scale saturation/lightness. Used for the companion glow color. */
export const shift = (hex: string, dh: number, sMul = 1, lMul = 1): string => {
  const { h, s, l } = rgbToHsl(hexToRgb(hex));
  return rgbToHex(
    hslToRgb({ h: (h + dh + 360) % 360, s: Math.min(1, s * sMul), l: Math.min(1, l * lMul) }),
  );
};

/** WCAG relative luminance (0–1). */
export const luminance = (hex: string): number => {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** WCAG contrast ratio between two colors (1–21). */
export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
