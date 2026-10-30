# motion-experiment-project

A practice "SaaS launch video" job, run end to end in code: brief → storyboard → Remotion build → polish.
The product, **Patchnote**, is made up: a GitHub app that turns a week's merged PRs into release notes.

**Result:** [`media/patchnote-launch-16x9.mp4`](media/patchnote-launch-16x9.mp4) · 30s · 1920×1080 · 60fps · H.264 + AAC · ~17.4 MB

Every frame and every sound is produced by code. No After Effects, no hand-set keyframes, no screenshots, no stock audio.

## The story (4 scenes, 14 keyframes)

| Scene | Frames | Beat |
|---|---|---|
| 1 Hook | 0–240 | A counter climbs to **47** PRs merged; a red "due 5:00 PM" pill. The 47 match-cuts into the GitHub badge. |
| 2 Problem | 240–720 | GitHub + Docs + chat look-alikes. The cursor copy-pastes PR titles, hesitates, gets pinged; the clock hits 4:48 in red. A violet band wipes it away. |
| 3 Fix | 720–1440 | The Patchnote dashboard. One click: 47 chips sort into Features 12 / Fixes 23 / Infra 12, then fold into a release card that types itself. |
| 4 Payoff | 1440–1800 | Changelog + chat + email at 4:51 (green). Logo, tagline, URL. |

Spec: [`docs/SPEC.md`](docs/SPEC.md) · Storyboard: [`storyboard/`](storyboard/)

## Run it

```bash
npm i --loglevel=error
npm run dev                      # Remotion Studio preview
npx remotion render PatchnoteLaunch out/patchnote-launch-16x9.mp4 --codec=h264
python3 scripts/make-audio.py    # regenerate the soundtrack (needs numpy + scipy)
```

## Where things live

- `src/theme.ts`: colors, easing, fonts, scene timing, **all copy and numbers**, the 47 PR chips, audio levels. Most client notes are a one-line edit here.
- `src/scenes/`: `Hook`, `Problem`, `Fix`, `Payoff`, plus `MatchCut` (1D transition).
- `src/components/`: cursor (bezier arcs, press + ring), clock pill, caption, window chrome, logo mark.
- `src/Soundtrack.tsx`: music bed + SFX, placed at frames each scene exports.
- `scripts/make-audio.py`: seeded synth for the bed (120 BPM, 1 beat = 30f) and one-shot SFX.

## Motion rules (enforced in code)

- Never linear: entrances ~30f with overshoot, exits ~18f, camera moves ease in-out.
- Readable text stays ≥ 90f (the caption component throws if not). Counters take ~60f.
- Siblings stagger 2–6f; groups animate as parent "nulls".
- Only `useCurrentFrame()`-driven animation; no CSS transitions; any randomness is seeded.
- Guards: the chip columns must add up to `STATS.merged` (12 + 23 + 12 = 47) or the build throws.

## Notes

- Fonts (Inter, JetBrains Mono) are bundled in `public/fonts` and load before frame 0. Both are SIL Open Font License 1.1.
- Third-party apps are stylized look-alikes with no real logos.
- `remotion.config.ts` uses a custom Chrome only when `REMOTION_CHROME` is set (a sandbox workaround); otherwise Remotion's default applies.
