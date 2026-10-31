#!/usr/bin/env bash
# Render stills at the storyboard frames (plus a few transition frames) into a folder.
# Usage: scripts/stills.sh out/base [extra remotion flags...]
set -euo pipefail
dir="${1:?output dir}"; shift || true
mkdir -p "$dir"
FRAMES="${FRAMES:-100 210 230 300 450 600 690 714 760 960 1150 1300 1400 1440 1550 1700 1790}"
for f in $FRAMES; do
  npx remotion still "${COMP:-PatchnoteLaunch}" "$dir/f$f.png" --frame="$f" --log=error "$@"
done
echo "rendered $(ls "$dir" | wc -l) stills to $dir"
