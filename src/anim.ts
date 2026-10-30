import { interpolate } from "remotion";
import { DUR, EASE } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 entrance progress (~30f, slight overshoot). */
export const enterAt = (frame: number, start: number, dur: number = DUR.enter) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: EASE.enter });

/** 1→0 exit progress (~18f, fast out). */
export const exitAt = (frame: number, start: number, dur: number = DUR.exit) =>
  interpolate(frame, [start, start + dur], [1, 0], { ...clamp, easing: EASE.exit });

/** Eased 0→1 for camera and other in-out moves. */
export const inOutAt = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], { ...clamp, easing: EASE.inOut });

/** Eased 0→1 that settles without overshoot (counters, fades). */
export const outAt = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], { ...clamp, easing: EASE.out });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Camera key: center of interest (canvas px) and zoom. */
export type Cam = { cx: number; cy: number; s: number };

/** Piecewise camera: holds between keys, eases (inOut) during each move. */
export const cameraAt = (frame: number, keys: { f: number; cam: Cam }[]): Cam => {
  let cam = keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame >= b.f) {
      cam = b.cam;
      continue;
    }
    if (frame > a.f) {
      const t = inOutAt(frame, a.f, b.f);
      cam = { cx: lerp(a.cam.cx, b.cam.cx, t), cy: lerp(a.cam.cy, b.cam.cy, t), s: lerp(a.cam.s, b.cam.s, t) };
    }
    break;
  }
  return cam;
};

/** CSS transform for a 1920×1080 world div (transform-origin 0 0), framed from the canvas center. */
export const camTransform = ({ cx, cy, s }: Cam, dx = 0, dy = 0) =>
  `translate(${960 - cx * s + dx}px, ${540 - cy * s + dy}px) scale(${s})`;

/** Deterministic decaying shake (no randomness). Amplitude in px. */
export const shakeAt = (frame: number, start: number, dur: number, amp: number) => {
  const d = frame - start;
  if (d < 0 || d > dur) return { x: 0, y: 0 };
  const decay = 1 - d / dur;
  return { x: amp * 1.4 * Math.sin(d * 1.9 + 0.7) * decay, y: amp * Math.sin(d * 2.6) * decay };
};
