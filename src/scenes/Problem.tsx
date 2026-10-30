import React from "react";
import { AbsoluteFill, interpolate, interpolateColors, Sequence, useCurrentFrame } from "remotion";
import { CLOCK, COLORS, COPY, DUR, EASE, HANDOFF, INTER, MONO, PRS, STATS, THIRD } from "../theme";
import { camTransform, cameraAt, enterAt, inOutAt, shakeAt } from "../anim";
import { Window } from "../components/Window";
import { Cursor, CursorKey } from "../components/Cursor";
import { ClockPill } from "../components/ClockPill";
import { Caption } from "../components/Caption";

// Scene 2 — PROBLEM (frames 240–720 global, 0–480 local). Board 2A f300 · 2B f450 · 2C f580 · 2D f700.
// The Sequence starts LEAD frames early (1D match cut): during local −14…0 only the code-host window
// fades up, on a transparent background, behind the Hook's flying "47".
const C = COPY.problem;
export const PROBLEM_LEAD = HANDOFF.matchCut;
const LEAD = PROBLEM_LEAD;
const END = 480;
/** Element id of the badge digits the MatchCut flies into. */
export const BADGE_COUNT_ID = "gh-merged-count";

// Layout (world px, 1920×1080, composed around the canvas center).
const GH = { x: 110, y: 160, w: 880, h: 740 };
const DOC = { x: 700, y: 260, w: 760, h: 640 };
const CHAT = { x: 1300, y: 150, w: 520, h: 560 };
const ROW_H = 66;
const rowY = (k: number) => GH.y + 130 + ROW_H * k + ROW_H / 2; // row center
const LINE_H = 42;
const LINES_TOP = DOC.y + 48 + 44 + 56 + 28;
const lineY = (k: number) => LINES_TOP + LINE_H * k + LINE_H / 2;

// Beats (local frames).
const B = {
  pileIn: [0, DUR.stagger, DUR.stagger * 2], // GitHub, Doc, Chat (4f stagger)
  pmMsg: 26,
  caption: [50, 200] as const,
  cursorIn: 50,
  loopStart: 64,
  loopCycle: 30, // row click (3f) → arc to Doc (15f) → paste (3f) → arc back (9f)
  clockMid: 150,
  hesitate1: [240, 262] as const,
  hesitate2: [284, 350] as const,
  ping: 322,
  desat: [440, 470] as const,
  sweep: [END - 32, END - 2] as const, // 2D wipe (30f) reveals Scene 3, which sits under it for HANDOFF.wipeLead frames
};

// Cursor path: copy-paste loop, then the "where was I?" hesitation, then the ping pulls it to chat.
const keys: CursorKey[] = [{ f: B.cursorIn, x: 600, y: 800 }];
const clicks: number[] = [];
const pasteAt: number[] = [];
C.pasted.forEach((line, i) => {
  const c = B.loopStart + B.loopCycle * i;
  const row = { x: 470, y: rowY(line.row) - 8 };
  // Land just past the end of the pasted text so the cursor never covers it (~13px/char at 27px Inter).
  const doc = { x: DOC.x + 48 + line.indent * 28 + line.text.length * 13 + 36, y: lineY(i) - 6 };
  keys.push({ f: c, ...row, arc: -0.3 }, { f: c + 3, ...row });
  keys.push({ f: c + 18, ...doc, arc: -0.3 }, { f: c + 21, ...doc });
  clicks.push(c, c + 18);
  pasteAt.push(c + 20);
});
const lastPaste = keys[keys.length - 1].f;
keys.push(
  { f: B.hesitate1[0], x: 1150, y: 505, arc: -0.2 },
  { f: B.hesitate1[1], x: 1150, y: 505 },
  { f: B.hesitate2[0], x: 1255, y: 495, arc: 0.15 },
  { f: B.hesitate2[1], x: 1255, y: 495 },
  { f: 380, x: CHAT.x + 210, y: CHAT.y + 250, arc: -0.25 },
  { f: 386, x: CHAT.x + 210, y: CHAT.y + 250 },
  { f: 430, x: 470, y: rowY(5) - 8, arc: 0.25 },
  { f: 480, x: 520, y: rowY(6) - 8, arc: 0.2 },
);
clicks.push(380, 430);

const camKeys = [
  { f: 0, cam: { cx: 960, cy: 540, s: 1 } },
  { f: 70, cam: { cx: 960, cy: 540, s: 1 } },
  { f: lastPaste, cam: { cx: 1020, cy: 505, s: 1.12 } }, // drift toward the Doc (2B); window tops stay under the clock
  { f: 262, cam: { cx: 960, cy: 540, s: 1 } }, // pull back so the hesitation reads wide (2C)
];

const MergeIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16">
    <circle cx={4} cy={3.5} r={2} fill="none" stroke={THIRD.merged} strokeWidth={1.6} />
    <circle cx={4} cy={12.5} r={2} fill="none" stroke={THIRD.merged} strokeWidth={1.6} />
    <circle cx={12} cy={8} r={2} fill="none" stroke={THIRD.merged} strokeWidth={1.6} />
    <path d="M4 5.5 V10.5 M4 5.5 Q4 8 10 8" fill="none" stroke={THIRD.merged} strokeWidth={1.6} />
  </svg>
);

const pileStyle = (frame: number, start: number): React.CSSProperties => {
  const p = enterAt(frame, start);
  return {
    opacity: Math.min(1, p * 1.6),
    transform: `translateY(${(1 - p) * 70}px) scale(${0.94 + 0.06 * p})`,
  };
};

const CodeHost: React.FC<{ frame: number }> = ({ frame }) => (
  <Window
    {...GH}
    title={C.repoUrl}
    // Fade only (no move) so the "47" lands exactly on the badge.
    style={{ opacity: interpolate(frame, [-LEAD, 0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out }) }}
  >
    <div style={{ height: 72, display: "flex", alignItems: "center", gap: 18, padding: "0 32px", borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: COLORS.muted }}>Open {STATS.open}</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 16px",
          borderRadius: 999,
          background: THIRD.merged,
          color: "#fff",
          fontSize: 22,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        ● <span id={BADGE_COUNT_ID} style={{ opacity: frame < 0 ? 0 : 1 }}>{STATS.merged}</span> Merged
      </div>
      <div style={{ marginLeft: "auto", fontSize: 18, color: COLORS.muted }}>{C.thisWeek}</div>
    </div>
    <div style={{ paddingTop: 10 }}>
      {PRS.map((pr, k) => {
        // Text selection flash when the cursor copies this row.
        const copyIdx = C.pasted.findIndex((l) => l.row === k);
        const sel =
          copyIdx < 0
            ? 0
            : interpolate(frame, [B.loopStart + B.loopCycle * copyIdx, B.loopStart + B.loopCycle * copyIdx + 2, B.loopStart + B.loopCycle * copyIdx + 22], [0, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
        return (
          <div key={pr.num} style={{ height: ROW_H, display: "flex", alignItems: "center", gap: 18, padding: "0 32px" }}>
            <MergeIcon />
            <div style={{ width: 92, fontFamily: MONO, fontSize: 19, color: COLORS.muted }}>#{pr.num}</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: COLORS.text,
                padding: "2px 6px",
                borderRadius: 4,
                background: `rgba(88,140,255,${0.35 * sel})`,
              }}
            >
              {pr.title}
            </div>
          </div>
        );
      })}
    </div>
  </Window>
);

const Doc: React.FC<{ frame: number }> = ({ frame }) => {
  const shown = pasteAt.filter((f) => frame >= f).length;
  const caretOn = Math.floor(frame / 16) % 2 === 0;
  return (
    <Window {...DOC} title={C.docWindow} bodyBg={THIRD.docPage} style={pileStyle(frame, B.pileIn[1])}>
      <div style={{ padding: "44px 48px 0" }}>
        <div style={{ height: 56, fontSize: 44, fontWeight: 600, color: THIRD.docInk, letterSpacing: -0.5 }}>{C.docTitle}</div>
      </div>
      <div style={{ position: "absolute", left: 48, top: LINES_TOP - DOC.y, right: 48 }}>
        {C.pasted.map((line, i) => {
          if (frame < pasteAt[i]) return null;
          const t = frame - pasteAt[i];
          const flash = interpolate(t, [0, 24], [0.9, 0], { extrapolateRight: "clamp", easing: EASE.out });
          const pop = interpolate(t, [0, 6], [0, 1], { extrapolateRight: "clamp", easing: EASE.out });
          return (
            <div key={i} style={{ height: LINE_H, display: "flex", alignItems: "center", paddingLeft: line.indent * 28 }}>
              <span
                style={{
                  fontSize: 27,
                  fontWeight: 400,
                  color: THIRD.docInk,
                  background: `rgba(255,229,138,${flash})`,
                  opacity: pop,
                  transform: `translateY(${(1 - pop) * 6}px)`,
                }}
              >
                {line.text}
              </span>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            left: (C.pasted[Math.max(0, shown - 1)]?.indent ?? 0) * 28 * (shown > 0 ? 1 : 0),
            top: shown * LINE_H + 6,
            width: 3,
            height: 30,
            background: THIRD.docInk,
            opacity: caretOn ? 1 : 0,
          }}
        />
      </div>
    </Window>
  );
};

const ChatMsg: React.FC<{ frame: number; at: number; name: string; time: string; text: string; avatar: string }> = ({
  frame,
  at,
  name,
  time,
  text,
  avatar,
}) => {
  const p = enterAt(frame, at);
  if (frame < at) return null;
  return (
    <div style={{ display: "flex", gap: 18, padding: "16px 28px", opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 20}px)` }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: avatar, flexShrink: 0 }} />
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>{name}</span>
          <span style={{ fontFamily: MONO, fontSize: 16, color: COLORS.muted }}>{time}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, color: COLORS.text, marginTop: 4 }}>{text}</div>
      </div>
    </div>
  );
};

const Chat: React.FC<{ frame: number }> = ({ frame }) => {
  const alarm = interpolate(frame, [B.ping, B.ping + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const border = interpolateColors(alarm, [0, 1], [COLORS.border, COLORS.danger]);
  return (
    <Window
      {...CHAT}
      title={C.chatChannel}
      border={border}
      style={{ ...pileStyle(frame, B.pileIn[2]), boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 ${40 * alarm}px ${COLORS.danger}55` }}
    >
      <div style={{ paddingTop: 18 }}>
        <ChatMsg frame={frame} at={B.pmMsg} name={C.pmName} time={CLOCK.problemStart} text={C.pmMsg} avatar={THIRD.avatarPM} />
        <ChatMsg frame={frame} at={B.ping} name={C.ctoName} time={CLOCK.problemLate} text={C.ctoMsg} avatar={THIRD.avatarCTO} />
      </div>
    </Window>
  );
};

export const Problem: React.FC = () => {
  const frame = useCurrentFrame() - LEAD; // scene-local frame; negative during the match-cut lead-in

  const base = cameraAt(frame, camKeys);
  const drift = interpolate(frame, [0, END], [1, 1.02], { extrapolateLeft: "clamp", easing: EASE.inOut }); // never fully static
  const pullBack = interpolate(frame, [B.desat[0], END], [1, 0.96], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
  const cam = { ...base, s: base.s * drift * pullBack };
  const shake = shakeAt(frame, B.ping, 10, 14); // ~1.5% of frame height

  // 2D: everything drains to gray and softens while the violet band sweeps L→R.
  const gray = inOutAt(frame, B.desat[0], B.desat[1]);
  const blur = 6 * inOutAt(frame, B.desat[0] + 5, END);
  const sweep = inOutAt(frame, B.sweep[0], B.sweep[1]);
  // End just past the right edge so the band is still crossing until the cut; its blurred, tilted tail
  // fades in the last 10% so nothing is left on screen at f720 (no 1-frame pop).
  const bandX = interpolate(sweep, [0, 1], [-800, 2100]);
  const bandO = interpolate(sweep, [0.9, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Keep only what is right of the band's center line; Scene 3 (frozen at its f0) shows through on the left.
  // A soft mask (±FEATHER px) instead of a hard clip, so bright content never shows a cut edge inside the band.
  const BAND_W = 520;
  const TILT_DEG = 14;
  const FEATHER = 80;
  const rad = (TILT_DEG * Math.PI) / 180;
  const gradAngle = 90 + TILT_DEG; // normal to the band, pointing right
  const gradLen = 1920 * Math.abs(Math.sin(((gradAngle) * Math.PI) / 180)) + 1080 * Math.abs(Math.cos((gradAngle * Math.PI) / 180));
  const bandCenterX = bandX + BAND_W / 2 + (550 - 540) * Math.tan(rad); // band center line at canvas mid-height
  const t0 = ((bandCenterX - 960) * Math.cos(rad)) / gradLen + 0.5;
  const f = FEATHER / gradLen;
  const mask =
    frame >= B.sweep[0]
      ? `linear-gradient(${gradAngle}deg, transparent ${(t0 - f) * 100}%, black ${(t0 + f) * 100}%)`
      : undefined;

  return (
    <AbsoluteFill style={{ fontFamily: INTER, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundColor: frame < 0 ? "transparent" : COLORS.bg,
          filter: `grayscale(${gray}) blur(${blur}px) brightness(${1 - 0.3 * gray})`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        <div style={{ position: "absolute", width: 1920, height: 1080, transformOrigin: "0 0", transform: camTransform(cam, shake.x, shake.y) }}>
          <CodeHost frame={frame} />
          <Doc frame={frame} />
          <Chat frame={frame} />
          <Sequence from={LEAD} layout="none" name="Cursor">
            <Cursor
              keys={keys}
              clicks={clicks}
              appear={B.cursorIn}
              wobble={[{ from: B.hesitate1[0], to: B.hesitate1[1] }, { from: B.hesitate2[0], to: B.ping }]}
              ghosts={[{ x: 1150, y: 505, from: B.hesitate1[1], to: 360 }]}
            />
          </Sequence>
        </div>
        <Sequence from={LEAD} layout="none" name="Clock + caption">
          <ClockPill
            opacity={enterAt(frame, 6)}
            beats={[
              { f: 0, time: CLOCK.problemStart, tone: "neutral" },
              { f: B.clockMid, time: CLOCK.problemMid, tone: "neutral" },
              { f: B.ping, time: CLOCK.problemLate, tone: "bad" },
            ]}
          />
          <Caption text={C.caption} from={B.caption[0]} to={B.caption[1]} />
        </Sequence>
      </AbsoluteFill>
      {frame >= B.sweep[0] ? (
        <div
          style={{
            position: "absolute",
            top: -300,
            left: bandX,
            width: BAND_W,
            height: 1700,
            transform: `rotate(${TILT_DEG}deg)`,
            background: `linear-gradient(90deg, transparent, ${COLORS.accent}cc 30%, #C9BAFF 50%, ${COLORS.accent}cc 70%, transparent)`,
            filter: "blur(28px)",
            mixBlendMode: "screen",
            opacity: bandO,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** Sound cues (scene-local frames) for src/Soundtrack.tsx. */
export const PROBLEM_SFX = {
  clicks,
  pmMsg: B.pmMsg,
  ping: B.ping,
  wipe: B.sweep[0],
};
