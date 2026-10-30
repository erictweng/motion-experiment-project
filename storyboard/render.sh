#!/usr/bin/env bash
# Render storyboard sheets to PNG: overview + one sheet per scene.
set -euo pipefail
cd "$(dirname "$0")"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p png
for s in all 1 2 3 4; do
  if [ "$s" = all ]; then W=1760; else W=1680; fi
  url="file://$PWD/board.html?scene=$s"
  H=$("$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=$W,4000 --virtual-time-budget=4000 \
      --dump-dom "$url&measure=1" 2>/dev/null | python3 -c 'import sys,re; m=re.search(r"data-h=\"(\d+)\"", sys.stdin.read()); print(m.group(1) if m else 3000)')
  "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=$W,$H --virtual-time-budget=4000 \
      --screenshot="$PWD/png/board-$s.png" "$url" 2>/dev/null
  echo "board-$s.png ${W}x${H}"
done
