# Spec — Patchnote 30s Launch Video (practice project)

**Status:** v1 storyboard drafted, waiting on Eric's review · **Path:** `~/projects/motion-demo` · **Updated:** 2026-10-30

## 1. Goal
Run one full "launch video" job end to end, the way a freelance client job would go: brief → storyboard → Figma assets → Remotion build → revisions → final render. Then decide whether this is worth selling (Upwork "SaaS launch video" gigs).

**Success =** a 30s 1920×1080 60fps MP4 that someone outside the project would believe came from a real motion studio, built in 1 working day or less, with every frame produced by code (no After Effects, no hand-set keyframes).

## 2. Client brief (made up)
- **Product:** Patchnote, a GitHub app that reads a week's merged PRs, writes release notes, and publishes them to a changelog, Slack and email.
- **Audience:** eng leads and PMs at 10–200 person startups.
- **Promise:** "Ship it. We'll write it up."
- **Story in one line:** it's Friday at 4 PM, 47 PRs merged, notes are due at 5. The copy-paste grind loses, and Patchnote gets them out by 4:51.

## 3. Deliverables
1. `patchnote-launch-16x9.mp4`: 1920×1080, 60fps, 30.0s (1800f), H.264.
2. Storyboard: `storyboard/png/board-*.png` (done, v1).
3. Figma file: 14 keyframe frames plus the UI components listed in §7.
4. Stretch: a 1080×1920 vertical cut that reuses the same scenes (needs the center-safe layout).

## 4. Story structure (4 scenes, 14 keyframes)
- **1 HOOK · 0:00–0:04 · f0–240**: 1A counter climbs → 1B "47 PRs merged this week." → 1C red "due 5:00 PM" pill → 1D match cut of the 47 into the GitHub badge.
- **2 PROBLEM · 0:04–0:12 · f240–720**: 2A GitHub + Doc + Slack "notes?? 👀" at 4:12 → 2B cursor arcs and pastes messy lines at 4:31 → 2C cursor hesitates, "@you ETA?", 4:48 in red, camera shake → 2D desaturate + violet sweep (wipe).
- **3 FIX · 0:12–0:24 · f720–1440**: 3A dashboard "Week 43 · 47 PRs", cursor to Generate → 3B chips sort into Features 12 / Fixes 23 / Infra 12, push in → 3C release card types itself → 3D ✓ Ready to publish, click Publish.
- **4 PAYOFF · 0:24–0:30 · f1440–1800**: 4A changelog + Slack 🎉 12 + email, clock 4:51 in green → 4B logo, tagline, URL hold.

**Continuity threads (what ties the shots together):**
- **The number 47:** the Hook counter, the GitHub badge and the dashboard header (12+23+12 = 47).
- **The clock:** 4:12 → 4:31 → 4:48 (red) → 4:49 → 4:50 → 4:51 (green). It's the stakes meter.
- **The same PR titles:** messy in the Doc (2B), sorted chips (3B), polished copy (3C), published (4A).
- **Violet** belongs to Patchnote only. The problem scenes are neutral or red, so the 2D sweep brings the brand in.

## 5. Visual system
- **Colors:** bg `#0B0D12`, surface `#151923`, border `#262B36`, text `#F2F4F8`, muted `#8A93A6`, accent `#7C5CFF`, ok `#3DDC97`, bad `#FF5C5C`.
- **Type:** Inter 600/800 for UI and headlines, JetBrains Mono for PR numbers and the clock. Loaded with `@remotion/google-fonts` before frame 0.
- **Third-party UI** (GitHub, Docs, Slack) is a stylized look-alike, not a pixel copy and not using their logos.

## 6. Motion rules (the "skill")
- Never linear. Entrances ~30f with ~10% overshoot (`EASE.enter`), exits ~18f (`EASE.exit`), camera moves use `EASE.inOut`.
- Readable text stays on screen ≥90f (1.5s). Counters take ~60f with ease-out.
- Stagger siblings by 2–6f. Start the next move before the last one settles, so nothing fully stops.
- Animate parent groups ("nulls"), not individual pieces.
- Cursor moves on quadratic-bezier arcs. A click is a press to scale 0.96 over 3f plus a ring.
- Canvas is locked at 1920×1080 and laid out from the center. Key content stays in the center 1080×1080 so a vertical cut works.
- Only `useCurrentFrame()`-driven animation: no CSS transitions, no `Math.random()` without a seed.

## 7. Assets
**Built in code (v1, no Figma needed):** clock pill, cursor, counter, chips, columns, release card, logo mark.
**From Figma (SVG, 1920-wide artboards, text not outlined), to raise fidelity:**
- `github-pr-list.svg`, `doc-window.svg`, `slack-thread.svg` (Scene 2)
- `dashboard.svg`, `button-generate.svg`, `release-card.svg` (Scene 3)
- `changelog-page.svg`, `email-preview.svg`, `logo.svg` (Scene 4)

Recommended base kit: Obra shadcn/ui Community 2.0 (CC BY 4.0, credit Obra Studio).

## 8. Build plan and milestones (each has a smoke test)
- **M0 · Setup (done):** Remotion project, theme tokens, Scene 1 built, animatic renders. *Smoke:* `npx remotion render` gives 1800 frames, no errors.
- **M1 · Storyboard (done, v1):** 14 keyframes with captions, camera notes and transitions. *Smoke:* Eric approves or marks up the boards.
- **M2 · Scene 2 Problem:** build from 2A–2D. *Smoke:* stills at f300/450/580/700 match the boards side by side.
- **M3 · Scene 3 Fix:** chip-sort system and typing card. *Smoke:* stills at f790/960/1200/1410 match, and the chip counts add up to 47.
- **M4 · Scene 4 Payoff + transitions:** 1D match cut, 2D wipe, 4A→4B exit. *Smoke:* scrub every scene boundary ±10f with no pops.
- **M5 · Polish pass:** easing review, glow, motion blur on fast chips, an optional SFX/music bed. *Smoke:* full render, then a "taste review" checklist against §6.
- **M6 · Revision drill:** simulate client notes (e.g. "make it 999 PRs", "swap the accent to teal") and time how long each change takes. *Smoke:* each change is under 10 minutes to re-render.

## 9. Acceptance criteria
- 30.0s, 1800f, 60fps, 1920×1080, H.264 MP4 under ~25 MB.
- Every frame on the board has a matching moment in the render (±15f).
- No font fallback, no element outside the safe area, no text on screen under 90f.
- Changing any copy or number takes a one-line edit in `theme.ts` or the scene props.

## 10. Out of scope
Voiceover, licensed music, real GitHub/Slack branding, 3D, client delivery.

## 11. Open questions for Eric
1. Keep **Patchnote** as the practice product, or swap in a real startup's landing page as a spec piece for the portfolio?
2. Do you want to build the Figma frames yourself (to learn the workflow), or should I generate v1 fully in code and use Figma later?
3. Is the vertical 9:16 cut in scope for v1?
4. Do you want music/SFX in the polish pass?
