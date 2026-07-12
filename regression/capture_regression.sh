#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:8765/index.html}"
OUT="${2:-regression/screenshots}"
mkdir -p "$OUT"
VIEWS=(hall hallDoors studioScreen studioEntry venue venueSeats tunnelFirst tunnelMiddle waiting thinking thinkingWindow sunset garden spark)
for v in "${VIEWS[@]}"; do
  chromium --headless --no-sandbox --use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist --window-size=1440,900 --virtual-time-budget=5000 --screenshot="$OUT/${v}.png" "$BASE?view=$v" || true
done
