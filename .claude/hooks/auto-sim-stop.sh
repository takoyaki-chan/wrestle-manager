#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
#  Stop Hook: ターン終了時にエンジン系ファイルが編集されていたら
#  auto-sim 5シード × 20シーズン(計100シーズン)を1回だけ実行する。
#  dirtyフラグは PostToolUse(auto-sim-check.sh) が立てる。
#  違反検出時は exit 2 でターンを継続させ、その場で修正に入らせる。
# ══════════════════════════════════════════════════════════════════════════════

PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
FLAG="$PROJECT_DIR/.claude/hooks/.autosim-dirty"

# 編集がなければ何もしない
[ -f "$FLAG" ] || exit 0

# 先にフラグを消す(違反→修正→再Stopの再実行は新規編集がフラグを立て直すことで担保)
rm -f "$FLAG"

FAIL=0
RESULT=""

for i in 1 2 3 4 5; do
  SEED=$((i * 31337))
  OUTPUT=$(node "$PROJECT_DIR/test/auto-sim.js" 20 "$SEED" 2>&1)
  if echo "$OUTPUT" | grep -q "ISSUES FOUND"; then
    FAIL=1
    VIOLATIONS=$(echo "$OUTPUT" | grep "\[WARN\]" | head -3)
    ERRORS=$(echo "$OUTPUT" | grep "\[ERROR\]" | head -3)
    RESULT="${RESULT}${VIOLATIONS}${ERRORS}"
  fi
done

if [ "$FAIL" -eq 1 ]; then
  echo "[auto-sim] VIOLATIONS DETECTED (turn-end batch check, 5 seeds x 20 seasons):" >&2
  echo "$RESULT" >&2
  echo "[auto-sim] Run 'node test/auto-sim.js 100' for details" >&2
  exit 2
fi

echo "[auto-sim] 100 seasons ALL CLEAR (turn-end batch check)" >&2
exit 0
