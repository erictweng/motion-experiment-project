# Master prompt: Patchnote launch video (motion-experiment-project)

> Paste everything below the line into a new agent session to continue this project.
> Repo: https://github.com/erictweng/motion-experiment-project · Last updated: 2026-10-30 · State: commit `19b3d5a`

---

You are continuing a code-only motion design project with me (Eric). It's a 30-second SaaS launch video for a made-up product, **Patchnote**, a GitHub app that reads a week's merged PRs, writes release notes and publishes them to a changelog, Slack and email. Everything is built in **Remotion 4 (React)**. There's no After Effects, no hand-set keyframes, no screenshots and no stock audio. The point is to practice the full freelance workflow (brief → storyboard → build → revisions → delivery) and decide whether "SaaS launch video" gigs are worth selling.

## 0. Before you touch anything

1. Clone and install: `git clone https://github.com/erictweng/motion-experiment-project && cd motion-experiment-project && npm i --loglevel=error` (Node 20+).
2. Read in this order: `docs/SPEC.md` (source of truth: §5 visual system, §6 motion rules, §9 acceptance), `storyboard/STORYBOARD.md` plus `storyboard/png/board-*.png` (14 keyframes with frame numbers), `src/theme.ts` (all tokens, copy and numbers), then one scene file (`src/scenes/Hook.tsx` is the shortest).
3. Confirm it renders: `npx remotion still PatchnoteLaunch /tmp/check.png --frame=960`. Preview with `npm run dev`.
4. If you're in a sandbox where Remotion can't download Chrome, set `REMOTION_CHROME=/path/to/chrome-headless-shell` (in the Claude cloud sandbox: `/opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell`). `remotion.config.ts` only uses it when that env var is set.

## 1. How I want to work

- **One milestone at a time.** After each one, show me stills at the storyboard frames, put them **side by side with the board panel** (board left, render right), list every difference from the board, then **wait for my OK** before starting the next.
- **Prove it, don't claim it.** Render frames and look at them. Measure positions from renders rather than guessing. Scrub transitions numerically (below). Say what you didn't verify.
- **Git:** commit as `Eric <erictweng@gmail.com>`. Set `git config user.name/user.email` in the repo before the first commit, and turn off sandbox commit signing. Never commit as "Claude". Push to `main`. Keep `node_modules/` and `out/` out of git. The current master video lives in `media/`.
- Give honest confidence levels when you assess quality or recommend options.

## 2. What exists (state at `19b3d5a`)

**Deliverable:** `media/patchnote-launch-16x9.mp4`: 1920×1080, 60fps, 1800 frames, H.264 + AAC 192k, 17.3 MB (budget is 25 MB), −16.9 LUFS integrated, −1.3 dBFS peak.

**Story (4 scenes, 14 keyframes, global frames):**

| Scene | Frames | What happens |
|---|---|---|
| 1 Hook | 0–240 | The counter climbs 0→47 (60f ease-out, teal glow). "PRs merged this week." A red "Release notes due · 5:00 PM" pill blinks. **1D match cut** (f226–240): the 47 flies on an arc into the "47 Merged" badge. |
| 2 Problem | 240–720 | Code-host, Docs and chat look-alikes pile in (4f stagger). The cursor runs 5 copy-paste loops on bezier arcs, pasting messy lines. The clock goes 4:12 → 4:31 → 4:48 (red). The cursor hesitates with a ghost trail. The CTO pings "@you ETA?" (shake about 1.5%). **2D wipe**: the frame desaturates and blurs while a teal band sweeps left to right and reveals Scene 3. |
| 3 Fix | 720–1440 | Patchnote dashboard, "Week 43 · 47 PRs merged". The cursor clicks Generate. 47 chips fly from a stack (2f stagger, 30f arcs, overshoot) into Features 12 / Fixes 23 / Infra 12. The columns fold into a release card that types one line every 8f with teal highlights. ✓ Ready to publish pops in. The cursor clicks Publish. |
| 4 Payoff | 1440–1800 | Opens on Scene 3's exact last frame. The card becomes the changelog; chat and email fan out (4f stagger, 3D turn). The clock flips to 4:51 PM ✓ (green), and 🎉 counts to 12. The cards exit (18f), then the logo scales 0.9→1.0 with overshoot, followed by the tagline, an **"Install free on GitHub →" CTA** (held 120f, with a cursor click) and `patchnote.dev`. |

**Continuity threads (don't break these):** the number 47 (counter → badge → dashboard header → 12+23+12); the clock 4:12 → 4:31 → 4:48 red → 4:49 → 4:50 → 4:51 green; the same PR titles in 2A → 3B → 3C → 4A; and the brand accent (teal `#10A090`, was violet until `19b3d5a`) belongs to Patchnote only (Scene 2 stays neutral or red until the wipe). The purple "Merged" badge in Scene 2 is the code-host look-alike's own color (`THIRD.merged`), not the brand.

## 3. Code map

```
src/theme.ts          Tokens + ALL copy/numbers: COLORS, BRAND (all accent tints, derived), EASE, DUR, SCENES, HANDOFF,
                      STATS, CLOCK, PRS, CATEGORIES (counts derived from STATS.merged), CHIPS (named pool), FILLER,
                      COPY.{hook,problem,fix,payoff}, AUDIO, BACKDROP, GRAIN
src/color.ts          alpha / tint / shift (HSL) / luminance / contrast helpers used by BRAND
scripts/stills.sh     Renders the board + transition frames into a folder (FRAMES="..." to override)
src/anim.ts           enterAt / exitAt / inOutAt / outAt, cameraAt(keys) + camTransform (center-framed), shakeAt
src/Composition.tsx   Sequence layout + layering (see §5 transitions), Vignette, Grain, Soundtrack
src/scenes/           Hook, Problem, Fix, Payoff, MatchCut (Board.tsx = old animatic placeholder, unused)
src/components/       Cursor (bezier arcs, press, ring, wobble, ghosts), ClockPill, Caption (≥90f guard),
                      Window (look-alike chrome), LogoMark (code-built), Backdrop (+ Vignette, Grain)
src/Soundtrack.tsx    Music bed + SFX, each cue at a frame exported by its scene (PROBLEM_SFX, FIX_SFX, PAYOFF_SFX)
scripts/make-audio.py Seeded synth → public/audio/*.wav (bed at 120 BPM: 1 beat = 30f; scene cuts land on beats)
public/fonts/         Inter 400/600/800 + JetBrains Mono 500 (OFL), loaded before frame 0 via @remotion/fonts
```

Each scene keeps its timing in a local `B = {...}` beat table (scene-local frames). Change timing there, and the sound cues follow automatically.

## 4. Practices we used (keep using them)

**Motion rules (SPEC §6), enforced in code:**
- Never linear. Entrances ~30f with ~10% overshoot (`EASE.enter`), exits ~18f (`EASE.exit`), camera `EASE.inOut`, counters and settles `EASE.out`. The only linear motion left is deliberate (typewriter reveal, some fades).
- Readable text stays on screen ≥90f. `Caption` **throws** if a caption is shorter. Counters take ~60f.
- Stagger siblings 2–6f. Animate parent groups ("nulls"); for example, each chip column is one group its chips land into.
- Cursor moves on quadratic-bezier arcs. A click is a 3f press to 0.96 plus a ring.
- The canvas is locked at 1920×1080. World layers sit at transform-origin 0 0, and `camTransform` frames them from the canvas center.
- **Only `useCurrentFrame()`-driven animation.** No CSS transitions or keyframes, no `Math.random()`. All noise is seeded (audio uses `default_rng(43)`).

**Editability:** every on-screen string and number lives in `theme.ts` or a scene beat table, so a client note should be a one-line edit. Recolor = change `COLORS.accent` (every tint, glow, backdrop field and text-on-accent color derives from it via `BRAND`; `BRAND.on` picks white or dark text by 3:1 contrast). PR count = change `STATS.merged` (category counts split 12:23:12 by largest remainder; columns cap at a 2×12 grid with a "+N more" chip; the match-cut badge target shifts per digit). Guard: category counts must sum to `STATS.merged`.

**Third-party UI:** stylized look-alikes only (no logos, "Docs" not "Google Docs", "# releases" not "Slack"). The `github.com/acme/app/pulls` URL is still shown; genericize it if a client cares.

**Verification loop (do this every milestone):**
1. `npx tsc --noEmit`.
2. Render stills at the board frames: `npx remotion still PatchnoteLaunch out/x.png --frame=N`.
3. Build board-vs-render side-by-sides with ffmpeg: crop the board panel, `hstack`, and label each one.
4. Render a scene as a `--scale=0.25` preview, then tile a contact sheet with `select='not(mod(n,20))',tile=6x4` to catch problems between keyframes.
5. **Scrub cuts numerically:** render ±10–25f around each boundary (`--sequence --image-format=png --scale=0.5`) and print the mean absolute pixel difference between consecutive frames. A cut is clean when the difference at the boundary frame is about 0, and motion should continue on both sides of it.
6. Measure positions from renders (threshold a color, take its bounding box) rather than computing them from CSS.

## 5. How the hard parts were done

- **Camera:** `cameraAt(frame, keys)` holds between keys and eases (inOut) between them. Each scene also multiplies in a slow whole-scene drift so it's never static. Phone-readability push-ins: Scene 2 opens at 1.85× on the badge; Scene 3 pushes onto the pasted lines in the Doc, punches in on "@you ETA?", then holds 1.28× on the typing card.
- **1D match cut:** `Problem` starts `HANDOFF.matchCut` (14) frames early with a transparent background, so only the code-host window fades up. `MatchCut` draws the 47 starting pixel-identical to the Hook counter. It shrinks geometrically along a quadratic arc to `BADGE_TARGET`, which is the measured badge position in world space projected through `problemCam(0)`. `BADGE_WORLD.x` adds half a tabular-digit advance (0.64em, measured) per digit beyond two, so it stays on target for any count. The badge's own digits stay hidden until local frame 0.
- **2D wipe:** Scene 3's frame 0 sits frozen (`<Freeze>`) under Scene 2 for the last `HANDOFF.wipeLead` (34) frames. Scene 2 gets a **soft linear-gradient mask** that follows the band's tilted center line, so Scene 3 is revealed in color while Scene 2 to the right stays gray. The band's blurred tail fades over the last 10% of the sweep so nothing pops at f720.
- **3→4 handoff:** Scene 4 re-renders `ReleaseCard` and `PublishButton` at `FIX_LAST_FRAME`, the cursor at its last pose, and the camera at `FIX_END_SCALE`. Frame 1440 is identical to frame 1439, and motion picks up by f1442.
- **Chip sort:** the shown chips (named first, then FILLER, then an optional "+N more") are interleaved by category so all three columns fill together, all inside a fixed 94f launch window. Each flies on a bezier from the stack top to its grid slot with `EASE.enter` overshoot. Header counts climb proportionally to the real totals as chips land.
- **Motion blur:** a 180° shutter trail. 4–8 sub-frame copies are drawn behind the moving element at decreasing opacity, only above a speed threshold (chips, plus the match-cut 47 with a scaled CSS blur). `@remotion/motion-blur`'s `HtmlInCanvasMotionBlur` needs Chrome 157+; use it instead if available.
- **Depth:** `Backdrop` draws drifting radial color fields (neutral in Scene 2, brand accent from Scene 3), plus a global `Vignette`. Rack focus in Scene 2 blurs the windows that aren't the subject during push-ins. Perspective tilts on the Scene 3 card entrance and the Scene 4 destination cards.
- **Audio:** `make-audio.py` synthesizes the bed: Hook tension pad and clock ticks; Problem in Am–F–Dm–E with a pulsing bass; Fix in C–G–Am–F, with the beat dropping on the Generate click (2.0s into the scene, beat-aligned); Payoff resolves on C at the logo; fade-out. It also synthesizes one-shots (click, tick, type, whoosh, ping, ping-alert, pop, chime, hit). Levels are in `AUDIO`. Check loudness with `ffmpeg -af ebur128=peak=true`.
- **Fonts:** bundled locally (the Google Fonts CDN is unreachable in some sandboxes). They load before frame 0, so there's no fallback. Emoji come from the system emoji font, a known minor fallback.

## 6. Commands

```bash
npm run dev                                                          # Studio preview
npx remotion still PatchnoteLaunch out/f960.png --frame=960          # one frame
npx remotion render PatchnoteLaunch out/patchnote-launch-16x9.mp4 \
  --codec=h264 --x264-preset=veryfast --audio-codec=aac --audio-bitrate=192k   # master (~6 min on 2 cores)
npx remotion render PatchnoteLaunch out/a.wav --codec=wav            # audio-only mix check
python3 scripts/make-audio.py                                        # regenerate audio (numpy, scipy)
cp out/patchnote-launch-16x9.mp4 media/ && git add -A && git commit && git push
```

## 7. What still needs doing (priority order, with my confidence it matters)

1. **Music (85%).** Replace the synth bed with a licensed track (Musicbed or Artlist), then re-time the beat tables so moves land on its beats and accents. Layer the SFX (whoosh + sub hit + UI tick) instead of single synth hits. Keep `AUDIO` levels and the Soundtrack cue system; swap only the files.
2. **Cutdowns (90% a client asks).** 9:16 (1080×1920) and 1:1 (1080×1080) compositions. 2A–2C (chat window), 3B (columns) and 4A (three cards) run outside the center 1080 square, so they need re-layouts, not crops. Ideally share scene code via a layout prop. Also cut 15s and 6s versions, a burned-in captions version, a no-text version, and a poster or thumbnail frame.
3. ~~M6 revision drill~~ **Done** (`74b7f27`, `57d9ffd`). Teal and 999-PR notes are each a one-line edit; about 7 min including a full re-render on 2 cores. Untested note types: new headline copy, longer PR titles, timing changes.
4. **Rhythm dead spots (70%).** Nothing moves for ~6f at f714–720 (the band settling) and ~12f at f1430–1442 (the finished card). Add a micro-move or start the next beat earlier. The sorted columns also sit for ~1.5s before folding; consider a speed ramp.
5. **Logo animation (60%).** Animate the mark itself (the patch diamond draws on, the stitch line sews across) instead of only scaling in.
6. **UI fidelity (65%).** Build the SPEC §7 Figma frames (shadcn/ui Obra kit, CC BY 4.0) and raise the dashboard, windows and cards from "generic dark theme" to a designed system: icon set, type scale, shadow levels, micro-detail.
7. **Small-text legibility.** The 47 PR chips (13px mono) are still texture on a phone. The column counts carry the meaning; consider fewer, larger chips for the vertical cut.
8. **Finish options.** Film grain is built (`GRAIN` in theme) but off: invisible at 0.05, and a visible strength costs several MB of H.264. A color grade or LUT pass is untried.
9. **Open questions from SPEC §11** are still unanswered: keep Patchnote or redo as a spec piece for a real startup; build the Figma frames by hand or not; vertical cut in v1 scope.

## 8. Acceptance (SPEC §9) — current status

- ✅ 30.0s, 1800f, 60fps, 1920×1080, H.264 under 25 MB (17.3 MB)
- ✅ Every board keyframe has a matching moment within ±15f (verified with side-by-sides for M2–M4)
- ✅ No font fallback for UI text (emoji excepted); ✅ no text under 90f
- ⚠️ "No element outside the safe area": several shots exceed the center 1080 square, as the boards do. Needs re-layout for the 9:16 and 1:1 cuts.
- ✅ Copy, numbers and brand color are one-line edits in `theme.ts` (verified by the M6 drill)
