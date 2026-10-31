import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BACKDROP, BRAND, CLOCK, COLORS, COPY, DUR, EASE, INTER, MONO, SCENES, STATS, THIRD } from "../theme";
import { camTransform, cameraAt, enterAt, exitAt, inOutAt, lerp } from "../anim";
import { Window } from "../components/Window";
import { ClockPill } from "../components/ClockPill";
import { Caption } from "../components/Caption";
import { LogoMark } from "../components/LogoMark";
import { Backdrop } from "../components/Backdrop";
import { Cursor, cursorPos, CursorGlyph } from "../components/Cursor";
import { FIX_LAST_FRAME, fixHandoff, PublishButton, ReleaseCard } from "./Fix";
import { Format, perFormat, useFormat } from "../format";

// Scene 4 — PAYOFF (frames 1440–1800 global, 0–360 local). Board 4A f1530 · 4B f1760.
// Frame 0 continues Scene 3's last frame exactly: same card, badge, Publish button, cursor and camera.
const C = COPY.payoff;

const B = {
  handoffOut: 0, // Publish button, badge and cursor clear (18f)
  fan: 2, // card becomes the changelog; chat + email fan out (4f stagger)
  clockGreen: 24,
  caption: [40, 196] as const,
  pmMsg: 44,
  reactions: [50, 110] as const, // 🎉 0 → 12 over ~60f
  cardsOut: 200, // exits ~18f, 3f stagger
  logoIn: 212,
  taglineIn: 226,
  ctaIn: 240, // CTA holds 240→360 (120f, ≥ 90f)
  urlIn: 252,
  ctaCursorIn: 262,
  ctaPress: 306,
};

const CARD_H = 545; // finished release card height (world px, measured from render at f1439)

// Destination layout (world px). The release card itself becomes the changelog page.
// 9:16 stacks changelog, chat and email top to bottom (still fanned, still overlapping).
const DESTS: Record<Format["id"], {
  changelog: { cx: number; cy: number; s: number; rot: number };
  chat: { x: number; y: number; w: number; h: number; rot: number };
  email: { cx: number; cy: number; w: number; h: number; rot: number };
}> = {
  wide: {
    changelog: { cx: 455, cy: 545, s: 0.6, rot: -3 },
    chat: { x: 700, y: 330, w: 520, h: 430, rot: 0 },
    email: { cx: 1470, cy: 548, w: 500, h: 420, rot: 3 },
  },
  vertical: {
    changelog: { cx: 390, cy: 560, s: 0.58, rot: -3 },
    chat: { x: 440, y: 700, w: 540, h: 430, rot: 0 },
    email: { cx: 420, cy: 1270, w: 520, h: 420, rot: 3 }, // bottom ~1480: clear of the app's caption/button area
  },
  square: {
    changelog: { cx: 455, cy: 545, s: 0.6, rot: -3 },
    chat: { x: 700, y: 330, w: 520, h: 430, rot: 0 },
    email: { cx: 1470, cy: 548, w: 500, h: 420, rot: 3 },
  }, // TODO stage 3
};
/** CTA button center on screen (measured from render at the end card). The CTA cursor path is relative to it. */
const CTA_CENTER: Record<Format["id"], { x: number; y: number }> = {
  wide: { x: 959, y: 663.5 }, // button x 645–1273, y 610–717
  vertical: { x: 539, y: 1197 }, // button x 224–854, y 1143–1251
  square: { x: 540, y: 663.5 }, // TODO stage 3
};

const payoffLayout = perFormat((fmt: Format) => {
  const H = fixHandoff(fmt);
  const CARD_CENTER = { x: H.CARD.x + H.CARD.w / 2, y: H.CARD.y + CARD_H / 2 };
  const camKeys = [
    { f: 0, cam: H.endCam },
    { f: B.cardsOut, cam: { ...H.endCam, s: 0.98 } }, // slow pull out across 4A
  ];
  const c = CTA_CENTER[fmt.id];
  const ctaCursor = [
    { f: B.ctaCursorIn, x: c.x + 561, y: c.y + 356.5 },
    { f: B.ctaPress - 6, x: c.x + 191, y: c.y + 38.5, arc: 0.3 },
    { f: B.ctaPress, x: c.x + 185, y: c.y + 34.5 },
    { f: 360, x: c.x + 179, y: c.y + 30.5 },
  ];
  return { DEST: DESTS[fmt.id], CARD_CENTER, camKeys, ctaCursor, publishCursor: H.publishCursor };
});

const fanP = (frame: number, i: number) => enterAt(frame, B.fan + DUR.stagger * i);
const outP = (frame: number, i: number) => exitAt(frame, B.cardsOut + 3 * i);
const outStyle = (e: number): React.CSSProperties => ({ opacity: e, scale: `${0.9 + 0.1 * e}`, translate: `0px ${-(1 - e) * 30}px` });

const ChangelogCard: React.FC<{ frame: number }> = ({ frame }) => {
  const { DEST, CARD_CENTER } = payoffLayout(useFormat());
  const p = fanP(frame, 0);
  const d = DEST.changelog;
  const e = outP(frame, 0);
  const x = lerp(CARD_CENTER.x, d.cx, p);
  const y = lerp(CARD_CENTER.y, d.cy, p);
  const s = lerp(1, d.s, p);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 3, ...outStyle(e), transformOrigin: `${d.cx}px ${d.cy}px` }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${CARD_CENTER.x}px ${CARD_CENTER.y}px`,
          // Slight 3D turn toward center as it fans out (depth).
          transform: `translate(${x - CARD_CENTER.x}px, ${y - CARD_CENTER.y}px) perspective(1800px) rotateY(${12 * p}deg) rotate(${d.rot * p}deg) scale(${s})`,
        }}
      >
        <ReleaseCard frame={FIX_LAST_FRAME} badgeOpacity={exitAt(frame, B.handoffOut)} />
      </div>
    </div>
  );
};

const Reaction: React.FC<{ frame: number; emoji: string; to: number; from: number }> = ({ frame, emoji, to, from }) => {
  const n = Math.round(interpolate(frame, [from, from + 60], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out }));
  const show = enterAt(frame, from - 6, 18);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        borderRadius: 999,
        background: BRAND.soft(0.18),
        border: `1px solid ${COLORS.accent}66`,
        fontSize: 38,
        fontWeight: 800,
        color: COLORS.text,
        fontVariantNumeric: "tabular-nums",
        opacity: Math.min(1, show * 1.5),
        transform: `scale(${0.6 + 0.4 * show})`,
      }}
    >
      <span>{emoji}</span>
      <span style={{ minWidth: 30 }}>{n}</span>
    </div>
  );
};

const ChatCard: React.FC<{ frame: number }> = ({ frame }) => {
  const { DEST, CARD_CENTER } = payoffLayout(useFormat());
  const p = fanP(frame, 1);
  const d = DEST.chat;
  const e = outP(frame, 1);
  const cx = d.x + d.w / 2;
  const cy = d.y + d.h / 2;
  const tx = lerp(CARD_CENTER.x - cx, 0, p);
  const ty = lerp(CARD_CENTER.y - cy, 0, p);
  const pm = enterAt(frame, B.pmMsg);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 2, ...outStyle(e), transformOrigin: `${cx}px ${cy}px` }}>
      <Window
        x={d.x}
        y={d.y}
        w={d.w}
        h={d.h}
        title={COPY.problem.chatChannel}
        style={{ opacity: Math.min(1, p * 1.6), transform: `translate(${tx}px, ${ty}px) scale(${0.8 + 0.2 * p})` }}
      >
        <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <LogoMark size={52} />
            <div>
              <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>{C.botName}</span>
                <span style={{ fontFamily: MONO, fontSize: 16, color: COLORS.muted }}>{CLOCK.published}</span>
              </div>
              <div style={{ fontSize: 27, fontWeight: 600, color: COLORS.text, marginTop: 4 }}>{C.botMsg}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, opacity: Math.min(1, pm * 1.5), transform: `translateY(${(1 - pm) * 16}px)` }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: THIRD.avatarPM, flexShrink: 0 }} />
            <div>
              <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.text }}>{COPY.problem.pmName}</span>
                <span style={{ fontFamily: MONO, fontSize: 16, color: COLORS.muted }}>{CLOCK.published}</span>
              </div>
              <div style={{ fontSize: 27, fontWeight: 600, color: COLORS.text, marginTop: 4 }}>{C.pmMsg}</div>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 96, bottom: 34, display: "flex", gap: 12 }}>
          <Reaction frame={frame} emoji="🎉" to={STATS.partyReactions} from={B.reactions[0]} />
          <Reaction frame={frame} emoji="👍" to={STATS.thumbsReactions} from={B.reactions[0] + 8} />
        </div>
      </Window>
    </div>
  );
};

const EmailCard: React.FC<{ frame: number }> = ({ frame }) => {
  const { DEST, CARD_CENTER } = payoffLayout(useFormat());
  const p = fanP(frame, 2);
  const d = DEST.email;
  const e = outP(frame, 2);
  const tx = lerp(CARD_CENTER.x - d.cx, 0, p);
  const ty = lerp(CARD_CENTER.y - d.cy, 0, p);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 1, ...outStyle(e), transformOrigin: `${d.cx}px ${d.cy}px` }}>
      <div
        style={{
          position: "absolute",
          left: d.cx - d.w / 2,
          top: d.cy - d.h / 2,
          width: d.w,
          height: d.h,
          borderRadius: 18,
          background: THIRD.docPage,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
          fontFamily: INTER,
          opacity: Math.min(1, p * 1.6),
          transform: `translate(${tx}px, ${ty}px) perspective(1800px) rotateY(${-12 * p}deg) rotate(${d.rot * p}deg) scale(${0.8 + 0.2 * p})`,
        }}
      >
        <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 26px", background: "#E9EAE6", fontSize: 18, fontWeight: 600, color: THIRD.docMuted }}>
          {C.emailBar}
        </div>
        <div style={{ padding: "30px 32px" }}>
          <div style={{ fontSize: 34, fontWeight: 800, color: THIRD.docInk, letterSpacing: -0.5, lineHeight: 1.2 }}>{C.emailTitle}</div>
          <div style={{ fontSize: 22, color: THIRD.docInk, marginTop: 18, lineHeight: 1.45 }}>{C.emailBody}</div>
          <div
            style={{
              display: "inline-block",
              marginTop: 26,
              padding: "12px 22px",
              borderRadius: 10,
              background: COLORS.accent,
              color: BRAND.on,
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            {C.emailCta}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Scene 3's Publish button + cursor, carried over at their last state, then cleared. */
const Handoff: React.FC<{ frame: number }> = ({ frame }) => {
  const { publishCursor } = payoffLayout(useFormat());
  const e = exitAt(frame, B.handoffOut);
  if (e <= 0) return null;
  const pos = cursorPos(FIX_LAST_FRAME, publishCursor);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: e, zIndex: 4 }}>
      <PublishButton frame={FIX_LAST_FRAME + frame} />
      <div style={{ position: "absolute", left: pos.x, top: pos.y, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))" }}>
        <CursorGlyph />
      </div>
    </div>
  );
};

export const CTA_ID = "cta-button";
const Logo: React.FC<{ frame: number }> = ({ frame }) => {
  const vertical = useFormat().id === "vertical";
  const p = enterAt(frame, B.logoIn);
  const tag = enterAt(frame, B.taglineIn);
  const url = enterAt(frame, B.urlIn);
  const cta = enterAt(frame, B.ctaIn);
  const d = frame - B.ctaPress;
  const press =
    d >= 0 && d < DUR.press * 2
      ? d < DUR.press
        ? interpolate(d, [0, DUR.press], [1, 0.96], { easing: EASE.inOut })
        : interpolate(d, [DUR.press, DUR.press * 2], [0.96, 1], { easing: EASE.out })
      : 1;
  const flash = interpolate(d, [0, 4, 30], [0, 1, 0.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  // Gentle breathing glow while it waits for the click (frame-driven).
  const breathe = 0.5 + 0.5 * Math.sin((frame - B.ctaIn) / 9);
  const drift = interpolate(frame, [B.logoIn, 360], [1, 1.01], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.inOut });
  if (frame < B.logoIn) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: INTER }}>
      <div style={{ textAlign: "center", transform: `scale(${drift})` }}>
        <div
          style={{
            display: "flex",
            flexDirection: vertical ? "column" : "row", // 9:16: mark above the wordmark (side by side is ~980px)
            alignItems: "center",
            justifyContent: "center",
            gap: vertical ? 34 : 40,
            opacity: Math.min(1, p * 1.6),
            transform: `scale(${0.9 + 0.1 * p})`, // 0.9 → 1.0 with overshoot (EASE.enter)
          }}
        >
          <LogoMark size={vertical ? 190 : 150} glow={30 * Math.min(1, p)} />
          <div style={{ fontSize: 160, fontWeight: 800, letterSpacing: -5, color: COLORS.text, lineHeight: 1 }}>{COPY.fix.brand}</div>
        </div>
        <div
          style={{
            fontSize: 60,
            fontWeight: 600,
            color: COLORS.muted,
            marginTop: 44,
            opacity: Math.min(1, tag * 1.5),
            transform: `translateY(${(1 - tag) * 24}px)`,
          }}
        >
          {C.tagline}
        </div>
        <div
          id={CTA_ID}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 18,
            marginTop: 52,
            padding: "26px 50px",
            borderRadius: 22,
            background: COLORS.accent,
            color: BRAND.on,
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: -0.5,
            opacity: Math.min(1, cta * 1.5),
            transform: `translateY(${(1 - cta) * 30}px) scale(${(0.92 + 0.08 * cta) * press})`,
            boxShadow: `0 0 ${50 + 20 * breathe + 70 * flash}px ${COLORS.accent}${flash > 0.05 ? "cc" : "88"}`,
          }}
        >
          {C.cta}
          <svg width={40} height={40} viewBox="0 0 24 24">
            <path d="M5 12 H18 M12.5 6.5 L18 12 L12.5 17.5" fill="none" stroke={BRAND.on} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 40,
            color: COLORS.muted,
            marginTop: 30,
            opacity: Math.min(1, url * 1.5),
            transform: `translateY(${(1 - url) * 20}px)`,
          }}
        >
          {C.url}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Payoff: React.FC = () => {
  const frame = useCurrentFrame();
  const fmt = useFormat();
  const L = payoffLayout(fmt);
  const cam = cameraAt(frame, L.camKeys);
  const clockO = exitAt(frame, B.cardsOut);
  // Soft violet bloom behind the logo.
  const bloom = inOutAt(frame, B.logoIn, B.logoIn + 60);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: INTER, overflow: "hidden" }}>
      <Backdrop tones={BACKDROP.brand} frameOffset={SCENES.payoff.from} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 50% 45% at 50% 50%, ${COLORS.accent}33, transparent 70%)`,
          opacity: bloom,
        }}
      />
      <div style={{ position: "absolute", width: fmt.W, height: fmt.H, transformOrigin: "0 0", transform: camTransform(cam, 0, 0, fmt.W, fmt.H) }}>
        <EmailCard frame={frame} />
        <ChatCard frame={frame} />
        <ChangelogCard frame={frame} />
        <Handoff frame={frame} />
      </div>
      <ClockPill
        opacity={clockO}
        beats={[
          { f: 0, time: CLOCK.fixDone, tone: "neutral" },
          { f: B.clockGreen, time: CLOCK.published, tone: "ok", check: true },
        ]}
      />
      <Caption text={C.caption} from={B.caption[0]} to={B.caption[1]} />
      <Logo frame={frame} />
      {/* CTA cursor path is relative to the button's measured center (CTA_CENTER). */}
      <Cursor
        keys={L.ctaCursor}
        clicks={[B.ctaPress]}
        appear={B.ctaCursorIn}
      />
    </AbsoluteFill>
  );
};


/** Sound cues (scene-local frames) for src/Soundtrack.tsx. */
export const PAYOFF_SFX = {
  clockGreen: B.clockGreen,
  reactions: B.reactions[0],
  pmMsg: B.pmMsg,
  logo: B.logoIn,
  ctaPress: B.ctaPress,
};
