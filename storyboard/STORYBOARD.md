# Patchnote — 30s Launch Video Storyboard (v0)

> **Superseded for visuals by v1 keyframe boards:** `storyboard/board.html` → `./storyboard/render.sh` → `storyboard/png/board-{all,1,2,3,4}.png` (14 keyframes 1A–4B). Spec: `docs/SPEC.md`.

**Product (made up):** Patchnote is a GitHub app that reads the week's merged PRs and writes release notes, then publishes them to the changelog, Slack and email.
**Audience:** eng leads and PMs at 10–200 person startups.
**One-line promise:** *Ship it. We'll write it up.*
**Spec:** 1920×1080 · 60fps · 30s = **1800 frames** · 16:9 master, keep critical content inside the 1080×1080 center square (safe for a later 9:16/1:1 cut).
**Arc:** Hook → Problem → Fix → Payoff. If a shot doesn't serve one of these, cut it.

## Brand (placeholder until Figma)
- Background `#0B0D12` (near-black), surface `#151923`, border `#262B36`
- Accent `#7C5CFF` (violet), success `#3DDC97`, danger `#FF5C5C`
- Type: **Inter** (UI + headlines, 600/800), **JetBrains Mono** (PR numbers, commit hashes)

---

## Scene 1 — HOOK · 0:00–0:04 · frames 0–240
| | |
|---|---|
| **On screen** | Black. A big counter climbs `0 → 47`, then the label types in: "PRs merged this week." |
| **Copy** | **47** PRs merged this week. |
| **Motion** | Counter counts over ~60f (1s) with ease-out and a soft violet glow that builds. Label slides up 24px and fades in, 6f after the counter lands. |
| **Camera** | Slow push-in, 100% → 104% scale across the whole scene (never fully static). |
| **Exit** | At f210, a faint "Release notes due · 5:00 PM" pill slides in from the bottom and starts to blink red. Hands off to Scene 2. |
| **Figma assets** | None (all typographic). |

## Scene 2 — PROBLEM · 0:04–0:12 · frames 240–720
| | |
|---|---|
| **On screen** | Three app windows overlap: a GitHub PR list, a blank Google Doc titled "Release Notes — Week 43", and Slack with a #releases message: "notes?? 👀". |
| **Copy** | Overlay at f300: "Every Friday, someone plays copy-paste." |
| **Motion** | The cursor moves in **arcs** (not straight lines) GitHub → Doc → Slack → GitHub. Each click gets a 3f press (scale 0.96). PR titles get pasted into the doc one at a time and pile up messily. Partway through, the cursor **hesitates** for about 20f between tabs ("where was I?"). A clock in the corner jumps 4:12 → 4:48. |
| **Camera** | Starts wide on all three windows, drifts toward the Doc, then a quick 1.5% shake as the Slack ping lands (f600). |
| **Exit** | At f690 everything desaturates and blurs as a violet light sweeps left to right. Match cut to Scene 3. |
| **Figma assets** | `github-pr-list.svg`, `doc-blank.svg`, `slack-thread.svg`, `cursor.svg` |

## Scene 3 — FIX · 0:12–0:24 · frames 720–1440
| | |
|---|---|
| **On screen** | The Patchnote dashboard. A "Week 43 · 47 PRs" header and a large **Generate notes** button. |
| **Copy** | Overlay at f760: "Patchnote reads every PR." Then at f1150: "…and writes the notes your users actually read." |
| **Motion** | (a) The cursor arcs to Generate; press (3f) and release. (b) 47 PR chips fly out of a stack and **sort into 3 columns**: ✨ Features · 🐛 Fixes · 🔧 Infra. They're staggered 2f apart with a slight overshoot as each lands, and the columns are grouped under parent nulls. (c) The columns collapse into a polished release-note card that types itself in, one line every 8f, with a violet highlight on each feature name. |
| **Camera** | Push from the button into the columns (ease in-out over 45f), then pull back to frame the finished card. The next move starts before the previous one settles. |
| **Exit** | A ✓ "Ready to publish" badge pops in (overshoot) at f1400. |
| **Figma assets** | `dashboard.svg`, `pr-chip.svg`, `column-header.svg`, `release-card.svg`, `button-generate.svg` |

## Scene 4 — PAYOFF · 0:24–0:30 · frames 1440–1800
| | |
|---|---|
| **On screen** | The release card splits into three destinations side by side: the public **Changelog** page, a Slack #releases post with 🎉 reactions climbing, and an email preview. Then they clear for the logo and tagline. |
| **Copy** | "Published everywhere. Before 5." → logo **Patchnote** → "Ship it. We'll write it up." → `patchnote.dev` |
| **Motion** | The 3 destination cards fan out with a 4f stagger. Slack reactions count 0 → 12. The clock from Scene 2 now reads 4:51 in green. Cards scale down and fade (exits are faster than entrances, about 18f) while the logo scales 0.9 → 1.0 with overshoot. |
| **Camera** | Slow pull-out for the whole scene and a final 1% drift on the logo (never fully stops). |
| **End** | Hold the logo and URL readable for ≥ 1.5s (f1700–1800). |
| **Figma assets** | `changelog-page.svg`, `slack-post.svg`, `email-preview.svg`, `logo.svg` |

---

## Global motion rules (feed these to Claude every time)
- Nothing moves linearly. Entrances take about 30f (0.5s) with a slight overshoot, and exits take about 18f.
- Every important text stays readable for ≥ 90f (1.5s).
- Stagger related elements 2–6f. Start the next move before the last one settles.
- Group related elements in a parent `<div>` ("null") and animate the group, not each piece.
- Cursor paths are arcs (quadratic bezier). Clicks get a press of scale 0.96 for 3f.
- Position everything relative to the canvas center. The canvas is locked at 1920×1080.
- Load fonts before the first frame. Use SVGs, never screenshots, for UI.

## Figma checklist (to replace placeholders)
1. Duplicate a free kit (e.g. Obra shadcn/ui Community, CC BY 4.0, credit Obra Studio).
2. Build the 11 frames listed above at **1920-wide** artboards (not 1440, which breaks the layout).
3. Export each as **SVG** with "Outline text" OFF (keeps text editable in code) into `assets/figma/`.
4. Drop brand colors into `src/theme.ts`.
