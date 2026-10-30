import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BACKDROP, BRAND, CATEGORIES, CHIPS, FILLER, CLOCK, COLORS, COPY, DUR, EASE, INTER, MONO, SCENES, STATS, UI } from "../theme";
import { camTransform, cameraAt, enterAt, exitAt, inOutAt, lerp } from "../anim";
import { Cursor, CursorKey } from "../components/Cursor";
import { ClockPill } from "../components/ClockPill";
import { Caption } from "../components/Caption";
import { LogoMark } from "../components/LogoMark";
import { Backdrop } from "../components/Backdrop";

// Scene 3 — FIX (frames 720–1440 global, 0–720 local). Board 3A f790 · 3B f960 · 3C f1200 · 3D f1410.
const C = COPY.fix;

// Beats (local frames).
const B = {
  stackIn: 4,
  buttonIn: 10,
  caption1: [40, 160] as const,
  cursorIn: 30,
  cursorOnButton: 80,
  click: 120, // 3f press on Generate notes
  anticipate: [126, 142] as const, // stack lifts before the burst
  launch: 142, // first chip leaves; then every 2f
  chipStagger: 2, // max gap between launches; more chips share the same sortWindow
  sortWindow: 94, // launch window for all chips (47 chips × 2f)
  flight: 30,
  columnsIn: 128,
  push: [150, 195] as const, // camera push into the columns (45f)
  collapse: 360, // columns fold into the card
  pullBack: [350, 410] as const,
  cardIn: 384,
  writing: [392, 440] as const,
  typeStart: 440, // one line every 8f
  lineEvery: 8,
  caption2: [430, 560] as const,
  clockBack: 556,
  publishIn: 600,
  cursor2In: 620,
  publishClick: 696,
  ready: 680, // ✓ badge pop
};

// Layout (world px).
const STACK = { x: 700, y: 600 };
const BTN = { cx: 1290, cy: 620, w: 440, h: 104 };
const COL = { x0: 340, gap: 470, top: 300, w: 450, h: 600 };
const CHIP = { w: 205, h: 34, rowH: 42, gridTop: 92, colOffset: 213 };
export const CARD = { x: 520, y: 200, w: 880 };
export const PUBLISH = { x: 1150, y: 790, w: 250, h: 80 };
const STACK_SCALE = 1.9;

// Chips per column: at most one 2×12 grid. Past that, the last slot is a "+N more" chip.
const GRID_SLOTS = 24;
const FILLER_START = Math.min(...CHIPS.map((c) => c.num)) - 1;
type Chip = { id: string; num: number; label: string; cat: (typeof CATEGORIES)[number]["id"]; more?: number };
const columnChips: Chip[][] = (() => {
  let fillerNum = FILLER_START;
  return CATEGORIES.map((cat) => {
    const overflow = cat.count > GRID_SLOTS;
    const real = overflow ? GRID_SLOTS - 1 : cat.count;
    const named: Chip[] = CHIPS.filter((c) => c.cat === cat.id).slice(0, real).map((c) => ({ ...c, id: `${c.num}` }));
    const filler: Chip[] = Array.from({ length: real - named.length }, (_, k) => {
      const num = fillerNum--;
      return { id: `${num}`, num, label: FILLER[(num * 7) % FILLER.length], cat: cat.id };
    });
    const more: Chip[] = overflow ? [{ id: `more-${cat.id}`, num: 0, label: "", cat: cat.id, more: cat.count - real }] : [];
    return [...named, ...filler, ...more];
  });
})();
const shownIn = (colIdx: number) => columnChips[colIdx].length;

// Launch order: interleave categories proportionally so all three columns fill together.
const withIdx = columnChips.flatMap((col, colIdx) => col.map((c, slot) => ({ ...c, slot, colIdx })));
const ordered = [...withIdx].sort(
  (a, b) => (a.slot + 0.5) / shownIn(a.colIdx) - (b.slot + 0.5) / shownIn(b.colIdx) || a.colIdx - b.colIdx,
);
const stagger = Math.min(B.chipStagger, B.sortWindow / ordered.length);
const chips = ordered.map((c, o) => ({
  ...c,
  order: o,
  launch: B.launch + stagger * o,
  rot: (((o * 37) % 13) - 6) * 1.4, // fixed fan angle per chip (deterministic)
}));
const landAt = (c: (typeof chips)[number]) => c.launch + B.flight;
const lastLanding = Math.max(...chips.map(landAt));

const colX = (i: number) => COL.x0 + COL.gap * i;
const slotPos = (colIdx: number, slot: number) => ({
  x: 16 + (slot % 2) * CHIP.colOffset,
  y: CHIP.gridTop + Math.floor(slot / 2) * CHIP.rowH,
});
const STACK_VISIBLE = 6;
/** Stack position by depth below the current top chip (top = 0 = launch point). */
const stackPos = (depth: number) => {
  const d = Math.min(depth, STACK_VISIBLE);
  return { x: STACK.x - d * 6, y: STACK.y + d * 9 };
};

export const PUBLISH_CURSOR: CursorKey[] = [
  { f: B.cursor2In, x: 1720, y: 1040 },
  { f: B.publishClick - 6, x: PUBLISH.x + 150, y: PUBLISH.y + 44, arc: 0.3 },
  { f: 720, x: PUBLISH.x + 146, y: PUBLISH.y + 42 },
];
export const FIX_LAST_FRAME = 719;
/** Camera drift at the end of Scene 3 (Scene 4 continues from it). */
/** Slow whole-scene drift (eased, never linear). Scene 4 reads its end value. */
export const fixDrift = (frame: number) =>
  interpolate(frame, [0, 720], [1, 1.03], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
export const FIX_END_SCALE = fixDrift(FIX_LAST_FRAME);

const camKeys = [
  { f: 0, cam: { cx: 960, cy: 540, s: 1 } },
  { f: B.push[0], cam: { cx: 960, cy: 540, s: 1 } }, // wide through 3A (sidebar stays in frame)
  { f: B.push[1], cam: { cx: 1035, cy: 560, s: 1.2 } }, // push in on the columns; dimmed header stays in frame
  { f: B.pullBack[0], cam: { cx: 1010, cy: 565, s: 1.22 } },
  { f: B.pullBack[1], cam: { cx: 960, cy: 485, s: 1.28 } }, // reframe straight onto the card as it types (3C)
  { f: 570, cam: { cx: 960, cy: 492, s: 1.26 } },
  { f: 625, cam: { cx: 960, cy: 540, s: 1 } }, // back to the full card + Publish (3D)
];

const Sparkle: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="-10 -10 20 20">
    <path d="M0 -9 Q1.2 -1.2 9 0 Q1.2 1.2 0 9 Q-1.2 1.2 -9 0 Q-1.2 -1.2 0 -9 Z" fill={color} />
  </svg>
);

const Check: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 20 20">
    <path d="M4 10.5 L8.3 14.5 L16 5.5" fill="none" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChipBox: React.FC<{ num: number; label: string; more?: number; style?: React.CSSProperties }> = ({ num, label, more, style }) => (
  <div
    style={{
      position: "absolute",
      width: CHIP.w,
      height: CHIP.h,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "0 10px",
      borderRadius: 8,
      background: UI.chip,
      border: `1px solid ${COLORS.border}`,
      fontFamily: MONO,
      fontSize: 13,
      color: COLORS.text,
      whiteSpace: "nowrap",
      overflow: "hidden",
      boxShadow: "0 6px 14px rgba(0,0,0,0.35)",
      ...style,
    }}
  >
    {more ? (
      <span style={{ color: UI.accentText, fontWeight: 600 }}>+{more.toLocaleString("en-US")} more</span>
    ) : (
      <>
        <span style={{ color: COLORS.muted }}>#{num}</span>
        <span>{label}</span>
      </>
    )}
  </div>
);

const Dashboard: React.FC<{ frame: number }> = ({ frame }) => {
  const fade = exitAt(frame, B.collapse - 10, 30);
  const dim = interpolate(frame, [B.push[0], B.push[1]], [1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 300,
          background: UI.sidebar,
          borderRight: `1px solid ${COLORS.border}`,
          padding: "48px 28px",
          opacity: dim,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 56 }}>
          <LogoMark size={40} />
          <div style={{ fontSize: 26, fontWeight: 800, color: COLORS.text }}>{C.brand}</div>
        </div>
        {C.nav.map((n, i) => (
          <div
            key={n}
            style={{
              fontSize: 22,
              fontWeight: 600,
              padding: "14px 18px",
              borderRadius: 10,
              marginBottom: 6,
              color: i === 0 ? COLORS.text : COLORS.muted,
              background: i === 0 ? COLORS.surface : "transparent",
              border: i === 0 ? `1px solid ${COLORS.border}` : "1px solid transparent",
            }}
          >
            {n}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 440, top: 118, opacity: dim }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: COLORS.muted }}>{C.repo}</div>
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2, color: COLORS.text, marginTop: 4 }}>
          Week {STATS.week} · <span style={{ color: COLORS.accent }}>{STATS.merged} PRs</span> merged
        </div>
      </div>
    </div>
  );
};

const GenerateButton: React.FC<{ frame: number }> = ({ frame }) => {
  const inP = enterAt(frame, B.buttonIn);
  const out = exitAt(frame, B.click + 12);
  const d = frame - B.click;
  const press =
    d >= 0 && d < DUR.press * 2
      ? d < DUR.press
        ? interpolate(d, [0, DUR.press], [1, 0.96], { easing: EASE.inOut })
        : interpolate(d, [DUR.press, DUR.press * 2], [0.96, 1], { easing: EASE.out })
      : 1;
  const hover = interpolate(frame, [B.cursorOnButton - 6, B.cursorOnButton + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
  const burst = interpolate(frame, [B.click, B.click + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  if (out <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: BTN.cx - BTN.w / 2,
        top: BTN.cy - BTN.h / 2,
        width: BTN.w,
        height: BTN.h,
        borderRadius: 18,
        background: COLORS.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        fontSize: 38,
        fontWeight: 800,
        color: "#fff",
        opacity: Math.min(1, inP * 1.5) * out,
        transform: `translateY(${(1 - inP) * 40}px) scale(${press * (0.85 + 0.15 * out)})`,
        filter: `brightness(${1 + 0.12 * hover})`,
        boxShadow: `0 0 ${50 + 40 * hover + 80 * burst}px ${COLORS.accent}${hover > 0 ? "aa" : "77"}`,
      }}
    >
      <Sparkle size={34} color="#fff" />
      {C.generate}
    </div>
  );
};

const Columns: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {CATEGORIES.map((cat, i) => {
      const inP = enterAt(frame, B.columnsIn + i * DUR.stagger);
      // Fold toward the card center (parent null: its chips follow).
      const q = inOutAt(frame, B.collapse + i * 3, B.collapse + 36 + i * 3);
      const cx = colX(i) + COL.w / 2;
      const cy = COL.top + COL.h / 2;
      const dx = (CARD.x + CARD.w / 2 - cx) * q;
      const dy = (CARD.y + 260 - cy) * q;
      const landed = chips.filter((c) => c.colIdx === i && frame >= landAt(c));
      const done = landed.length === shownIn(i);
      // Header climbs to the real count as the representative chips land.
      const shownCount = done ? cat.count : Math.round((cat.count * landed.length) / shownIn(i));
      const lastLand = landed.length ? Math.max(...landed.map(landAt)) : -99;
      const pop = interpolate(frame - lastLand, [0, 3, 10], [1, 1.18, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
      if (frame < B.columnsIn) return null;
      return (
        <div
          key={cat.id}
          style={{
            position: "absolute",
            left: colX(i),
            top: COL.top,
            width: COL.w,
            height: COL.h,
            borderRadius: 18,
            background: `${COLORS.surface}`,
            border: `1px solid ${COLORS.border}`,
            opacity: Math.min(1, inP * 1.5) * (1 - q),
            transform: `translate(${dx}px, ${dy + (1 - inP) * 40}px) scale(${1 - 0.7 * q})`,
          }}
        >
          <div style={{ height: 78, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ fontSize: 30 }}>{cat.icon}</span>
            <span style={{ fontSize: 32, fontWeight: 800, color: COLORS.text }}>{cat.label}</span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: MONO,
                fontSize: 46, // the number that matters in 3B: phone-readable
                color: done ? COLORS.text : COLORS.muted,
                transform: `scale(${pop})`,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {shownCount}
            </span>
          </div>
          {landed.map((c) => {
            const p = slotPos(i, c.slot);
            // Brief violet glow as the chip lands (12f).
            const g = interpolate(frame - landAt(c), [0, 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
            return (
              <ChipBox
                key={c.id}
                num={c.num}
                label={c.label}
                more={c.more}
                style={{
                  left: p.x,
                  top: p.y,
                  borderColor: g > 0.01 ? BRAND.soft(0.3 + 0.7 * g) : undefined,
                  boxShadow: g > 0.01 ? `0 0 ${18 * g}px ${COLORS.accent}88, 0 6px 14px rgba(0,0,0,0.35)` : undefined,
                }}
              />
            );
          })}
        </div>
      );
    })}
  </>
);

const ChipStack: React.FC<{ frame: number }> = ({ frame }) => {
  const inP = enterAt(frame, B.stackIn);
  const lift = interpolate(frame, [B.anticipate[0], B.anticipate[1]], [1, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
  const waiting = chips.filter((c) => frame < c.launch);
  const top = waiting.length ? waiting[0].order : 0;
  const visible = waiting.filter((c) => c.order - top < STACK_VISIBLE).reverse(); // bottom first
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: Math.min(1, inP * 1.5),
        transform: `translateY(${(1 - inP) * 50}px)`,
      }}
    >
      {visible.map((c) => {
        const s = stackPos(c.order - top);
        return (
          <ChipBox
            key={c.id}
            num={c.num}
            label={c.label}
            more={c.more}
            style={{
              left: s.x - CHIP.w / 2,
              top: s.y - CHIP.h / 2,
              transform: `rotate(${c.rot}deg) scale(${STACK_SCALE * lift})`,
            }}
          />
        );
      })}
    </div>
  );
};

/** Chip pose in flight at a (possibly fractional) frame: arc from the stack to its slot. */
const chipPose = (c: (typeof chips)[number], f: number) => {
  const p = enterAt(f, c.launch, B.flight); // overshoots slightly past the slot, then settles
  const s = stackPos(0);
  const sl = slotPos(c.colIdx, c.slot);
  const t = { x: colX(c.colIdx) + sl.x + CHIP.w / 2, y: COL.top + sl.y + CHIP.h / 2 };
  const ctrl = { x: (s.x + t.x) / 2, y: Math.min(s.y, t.y) - 200 };
  const u = 1 - p;
  return {
    x: u * u * s.x + 2 * u * p * ctrl.x + p * p * t.x,
    y: u * u * s.y + 2 * u * p * ctrl.y + p * p * t.y,
    rot: lerp(c.rot, 0, Math.min(1, p)),
    scale: lerp(STACK_SCALE, 1, Math.min(1, p)),
  };
};

// Motion blur: a 180° shutter sampled 4× behind the current pose (deterministic, works in any renderer).
const SHUTTER = 0.5; // fraction of a frame
const BLUR_SAMPLES = [0.42, 0.26, 0.15, 0.08]; // opacity per trailing sample
const BLUR_MIN_SPEED = 6; // px/frame before a trail is drawn

const FlyingChips: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {chips
      .filter((c) => frame >= c.launch && frame < landAt(c))
      .map((c) => {
        const now = chipPose(c, frame);
        const before = chipPose(c, frame - 1);
        const speed = Math.hypot(now.x - before.x, now.y - before.y);
        const poses = speed > BLUR_MIN_SPEED
          ? BLUR_SAMPLES.map((o, k) => ({ ...chipPose(c, frame - (SHUTTER * (k + 1)) / BLUR_SAMPLES.length), o }))
          : [];
        return (
          <React.Fragment key={c.id}>
            {poses.reverse().map((q, k) => (
              <ChipBox
                key={k}
                num={c.num}
                label={c.label}
                more={c.more}
                style={{
                  left: q.x - CHIP.w / 2,
                  top: q.y - CHIP.h / 2,
                  zIndex: 4,
                  opacity: q.o,
                  boxShadow: "none",
                  filter: "blur(1.5px)",
                  transform: `rotate(${q.rot}deg) scale(${q.scale})`,
                }}
              />
            ))}
            <ChipBox
              num={c.num}
              label={c.label}
              more={c.more}
              style={{
                left: now.x - CHIP.w / 2,
                top: now.y - CHIP.h / 2,
                zIndex: 5,
                transform: `rotate(${now.rot}deg) scale(${now.scale})`,
              }}
            />
          </React.Fragment>
        );
      })}
  </>
);

// Card lines: title + COPY.fix.card, typed one every 8f (characters revealed within the slot).
type Seg = { t: string; hl?: boolean };
const lines: ({ kind: "title"; segs: Seg[] } | { kind: "label"; segs: Seg[] } | { kind: "item"; icon: string; segs: Seg[] })[] = [
  { kind: "title", segs: [{ t: C.cardTitle }] },
  ...C.card.map((l) =>
    l.kind === "label" ? { kind: "label" as const, segs: [{ t: l.text as string }] } : { kind: "item" as const, icon: l.icon as string, segs: l.segs as Seg[] },
  ),
];
const typeEnd = B.typeStart + B.lineEvery * lines.length;

/** Reveals `shown` characters across segments; the rest stays in layout (transparent) so wrapping never jumps. */
const TypedSegs: React.FC<{ segs: Seg[]; shown: number; caret?: React.ReactNode }> = ({ segs, shown, caret }) => {
  let left = shown;
  let caretPlaced = false;
  const out: React.ReactNode[] = [];
  segs.forEach((s, i) => {
    const vis = Math.max(0, Math.min(s.t.length, left));
    left -= s.t.length;
    const placeCaretHere = !caretPlaced && (vis < s.t.length || i === segs.length - 1);
    const hl: React.CSSProperties = s.hl ? { background: UI.accentSoft, color: UI.accentText, borderRadius: 6, padding: "0 6px", fontWeight: 600 } : {};
    out.push(
      <span key={`v${i}`} style={vis > 0 ? hl : undefined}>
        {s.t.slice(0, vis)}
      </span>,
    );
    if (placeCaretHere) {
      caretPlaced = true;
      out.push(<React.Fragment key={`c${i}`}>{caret}</React.Fragment>);
    }
    out.push(
      <span key={`h${i}`} style={{ color: "transparent" }}>
        {s.t.slice(vis)}
      </span>,
    );
  });
  return <>{out}</>;
};

export const ReleaseCard: React.FC<{ frame: number; badgeOpacity?: number }> = ({ frame, badgeOpacity = 1 }) => {
  const inP = enterAt(frame, B.cardIn);
  const writing = frame >= B.writing[0] && frame < B.writing[1] + 8;
  const writingO = enterAt(frame, B.writing[0], 12) * exitAt(frame, B.writing[1], 8);
  const activeLine = Math.floor((frame - B.typeStart) / B.lineEvery);
  const caretBlink = frame < typeEnd || Math.floor(frame / 16) % 2 === 0;
  const caretVisible = frame >= B.typeStart && frame < typeEnd + 40 && caretBlink;
  if (frame < B.cardIn) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: CARD.x,
        top: CARD.y,
        width: CARD.w,
        padding: 48,
        borderRadius: 24,
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
        opacity: Math.min(1, inP * 1.5),
        // Tips up out of the folded columns (perspective entrance).
        transform: `perspective(1600px) rotateX(${(1 - inP) * 16}deg) scale(${0.92 + 0.08 * inP})`,
        fontFamily: INTER,
        color: COLORS.text,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 600, color: COLORS.muted, marginBottom: 10 }}>{C.cardUrl}</div>
      <div style={{ position: "relative" }}>
        {lines.map((l, i) => {
          const start = B.typeStart + B.lineEvery * i;
          const len = l.segs.reduce((n, s) => n + s.t.length, 0);
          const shown = Math.round(len * interpolate(frame, [start, start + B.lineEvery], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
          const isActive = i === Math.min(activeLine, lines.length - 1) && frame >= B.typeStart;
          const caret = isActive && caretVisible ? (
            <span style={{ display: "inline-block", width: 3, height: "1em", background: COLORS.accent, marginLeft: 2, verticalAlign: "-0.12em" }} />
          ) : null;
          if (l.kind === "title") {
            return (
              <div key={i} style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1.5, marginBottom: 26, opacity: frame >= start ? 1 : 0 }}>
                <TypedSegs segs={l.segs} shown={shown} caret={caret} />
              </div>
            );
          }
          if (l.kind === "label") {
            return (
              <div key={i} style={{ fontSize: 17, fontWeight: 800, letterSpacing: 3, color: COLORS.muted, margin: "14px 0 12px" }}>
                <TypedSegs segs={l.segs} shown={shown} caret={caret} />
              </div>
            );
          }
          return (
            <div key={i} style={{ display: "flex", gap: 14, fontSize: 32, fontWeight: 400, lineHeight: 1.35, marginBottom: 10 }}>
              <span style={{ opacity: frame >= start ? 1 : 0 }}>{l.icon}</span>
              <span>
                <TypedSegs segs={l.segs} shown={shown} caret={caret} />
              </span>
            </div>
          );
        })}
        {writing ? (
          <div style={{ position: "absolute", inset: 0, opacity: writingO }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 24, fontWeight: 600, color: UI.accentText, marginBottom: 26 }}>
              <span style={{ transform: `rotate(${frame * 4}deg)`, display: "inline-flex" }}>
                <Sparkle size={26} color={COLORS.accent} />
              </span>
              {C.writing}
            </div>
            {[0.8, 0.55, 0.7, 0.4].map((w, i) => {
              const sh = ((frame - B.writing[0]) * 0.04 + i * 0.15) % 1.4;
              return (
                <div
                  key={i}
                  style={{
                    height: 24,
                    width: `${w * 100}%`,
                    borderRadius: 8,
                    marginBottom: 22,
                    background: `linear-gradient(90deg, ${COLORS.border} ${(sh - 0.3) * 100}%, ${UI.accentSoft} ${sh * 100}%, ${COLORS.border} ${(sh + 0.3) * 100}%)`,
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
      <div style={{ opacity: badgeOpacity }}>
        <ReadyBadge frame={frame} />
      </div>
    </div>
  );
};

const ReadyBadge: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < B.ready) return null;
  // Pop with ~115% overshoot, then settle.
  const s = interpolate(frame, [B.ready, B.ready + 10, B.ready + 20], [0, 1.15, 1], {
    extrapolateRight: "clamp",
    easing: EASE.out,
  });
  return (
    <div
      style={{
        position: "absolute",
        right: -34,
        top: -30,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 24px 12px 18px",
        borderRadius: 999,
        background: COLORS.success,
        color: COLORS.bg,
        fontSize: 26,
        fontWeight: 800,
        transform: `rotate(-4deg) scale(${s})`,
        boxShadow: `0 0 40px ${COLORS.success}66`,
      }}
    >
      <Check size={26} color={COLORS.bg} />
      {C.ready}
    </div>
  );
};

export const PublishButton: React.FC<{ frame: number }> = ({ frame }) => {
  const inP = enterAt(frame, B.publishIn);
  const d = frame - B.publishClick;
  const press = d >= 0 && d < DUR.press * 2 ? (d < DUR.press ? interpolate(d, [0, DUR.press], [1, 0.96], { easing: EASE.inOut }) : interpolate(d, [DUR.press, DUR.press * 2], [0.96, 1], { easing: EASE.out })) : 1;
  const flash = interpolate(d, [0, 4, 20], [0, 1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  if (frame < B.publishIn) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: PUBLISH.x,
        top: PUBLISH.y,
        width: PUBLISH.w,
        height: PUBLISH.h,
        borderRadius: 16,
        background: COLORS.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 32,
        fontWeight: 800,
        color: "#fff",
        opacity: Math.min(1, inP * 1.5),
        transform: `translateY(${(1 - inP) * 30}px) scale(${press})`,
        boxShadow: `0 0 ${40 + 60 * flash}px ${COLORS.accent}99`,
      }}
    >
      {C.publish}
    </div>
  );
};

export const Fix: React.FC = () => {
  const frame = useCurrentFrame();
  const base = cameraAt(frame, camKeys);
  const drift = fixDrift(frame); // never fully static
  // Revealed by the 2D wipe slightly pushed in, then settles; ease-out so it moves from frame 0.
  const settle = interpolate(frame, [0, 75], [1.025, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const cam = { ...base, s: base.s * drift * settle };
  const clockO = frame < 300 ? exitAt(frame, B.push[0], DUR.exit) : enterAt(frame, B.clockBack);

  if (lastLanding >= B.collapse) throw new Error(`Chips still landing at ${lastLanding}, collapse starts at ${B.collapse}`);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: INTER, overflow: "hidden" }}>
      <Backdrop tones={BACKDROP.brand} frameOffset={SCENES.fix.from} />
      <div style={{ position: "absolute", width: 1920, height: 1080, transformOrigin: "0 0", transform: camTransform(cam) }}>
        <Dashboard frame={frame} />
        <Columns frame={frame} />
        <ChipStack frame={frame} />
        <GenerateButton frame={frame} />
        <FlyingChips frame={frame} />
        <ReleaseCard frame={frame} />
        <PublishButton frame={frame} />
        <Cursor
          keys={[
            { f: B.cursorIn, x: 1720, y: 1040 },
            { f: B.cursorOnButton, x: 1320, y: 640, arc: 0.3 },
            { f: B.click, x: 1300, y: 628 },
          ]}
          clicks={[B.click]}
          appear={B.cursorIn}
          vanish={B.click + 14}
        />
        <Cursor
          keys={PUBLISH_CURSOR}
          clicks={[B.publishClick]}
          appear={B.cursor2In}
        />
      </div>
      <ClockPill
        opacity={clockO}
        beats={[
          { f: 0, time: CLOCK.problemLate, tone: "bad" },
          { f: 14, time: CLOCK.fixStart, tone: "neutral" },
          { f: B.clockBack, time: CLOCK.fixDone, tone: "neutral" },
        ]}
      />
      <Caption text={C.caption1} from={B.caption1[0]} to={B.caption1[1]} />
      <Caption text={C.caption2} from={B.caption2[0]} to={B.caption2[1]} />
    </AbsoluteFill>
  );
};

/** Sound cues (scene-local frames) for src/Soundtrack.tsx. */
export const FIX_SFX = {
  generate: B.click,
  lands: chips.map(landAt),
  lines: lines.map((_, i) => B.typeStart + B.lineEvery * i),
  ready: B.ready,
  publish: B.publishClick,
};
