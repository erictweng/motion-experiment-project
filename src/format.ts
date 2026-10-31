import { useVideoConfig } from "remotion";

// Output formats. Every scene lays out from the canvas size so one codebase renders all three cuts.
// 16:9 values reduce to the original 1920×1080 numbers, so the master is unchanged.
export type FormatId = "wide" | "vertical" | "square";

export type Format = {
  id: FormatId;
  W: number;
  H: number;
  /** Clock pill top (screen px). Vertical keeps it under the phone status / app top bar. */
  clockY: number;
  /** Caption bottom (screen px). Vertical keeps it above the Reels/TikTok caption + button area. */
  captionBottom: number;
  /** Caption max width before it wraps. */
  captionMaxW: number;
  /** If set, captions sit at this top (screen px) instead of the bottom (9:16: under the clock, clear of the app UI). */
  captionTop?: number;
};

export const FORMATS: Record<FormatId, Format> = {
  wide: { id: "wide", W: 1920, H: 1080, clockY: 64, captionBottom: 84, captionMaxW: 1920 },
  vertical: { id: "vertical", W: 1080, H: 1920, clockY: 190, captionBottom: 380, captionMaxW: 920, captionTop: 296 },
  square: { id: "square", W: 1080, H: 1080, clockY: 48, captionBottom: 64, captionMaxW: 960 },
};

export const formatFor = (width: number, height: number): Format =>
  width > height ? FORMATS.wide : width < height ? FORMATS.vertical : FORMATS.square;

/** The current composition's format (from its width/height). */
export const useFormat = (): Format => {
  const { width, height } = useVideoConfig();
  return formatFor(width, height);
};

/** Cache a per-format build (layouts, cursor paths, camera keys) so it is computed once per format. */
export const perFormat = <T>(build: (f: Format) => T) => {
  const cache = new Map<FormatId, T>();
  return (f: Format): T => {
    let v = cache.get(f.id);
    if (v === undefined) {
      v = build(f);
      cache.set(f.id, v);
    }
    return v;
  };
};
