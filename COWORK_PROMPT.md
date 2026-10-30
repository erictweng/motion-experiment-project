Use the remotion-best-practices skill.

This folder is a Remotion 4 project (`patchnote-motion-demo`): a 30s, 1920x1080, 60fps launch video for a made-up product called Patchnote. Read these before you write any code:
- `docs/SPEC.md`: the source of truth. Follow §5 Visual system, §6 Motion rules and §9 Acceptance criteria exactly.
- `storyboard/STORYBOARD.md` and `storyboard/png/board-*.png`: 14 keyframes with frame numbers, captions and camera notes.
- `src/theme.ts`: colors, easing (`EASE.enter/exit/inOut`) and fonts. Use these. Don't hardcode values.
- `src/scenes/Hook.tsx`: Scene 1, already built. Match its style.

Setup: run `npm i --loglevel=error`, then `npx remotion render` once to confirm the existing project renders.

Task: build milestones M2, M3 and M4 from SPEC §8, one at a time:
- **M2, Scene 2 Problem (f240–720):** render stills at f300, f450, f580 and f700 and compare each one side by side with board 2.
- **M3, Scene 3 Fix (f720–1440):** render stills at f790, f960, f1200 and f1410. The chip counts must add up to 47 (12 + 23 + 12).
- **M4, Scene 4 Payoff + transitions (f1440–1800):** scrub every scene boundary ±10f and check there are no pops.

After each milestone, show me the stills and list any differences from the boards. Wait for my OK before you start the next one.

Rules:
- Only use `useCurrentFrame()`-driven animation. No CSS transitions, and no unseeded randomness.
- Keep copy and numbers in `theme.ts` or scene props, so any change is a one-line edit.
- Make third-party UI (GitHub, Docs, Slack) a stylized look-alike. Don't use real logos.
- Final output: `out/patchnote-launch-16x9.mp4` (H.264, 1800 frames, under ~25 MB).
