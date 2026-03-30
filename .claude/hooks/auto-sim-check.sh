#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
#  PostToolUse Hook: engine.js / data.js 編集後に auto-sim を自動実行
#  5シード × 20シーズン（100シーズン）の軽量チェック
# ══════════════════════════════════════════════════════════════════════════════

INPUT=$(cat)

# node で file_path を抽出（Windows互換: stdinをパイプで渡す）
FILE_PATH=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log((j.tool_input&&j.tool_input.file_path)||'')}catch(e){console.log('')}})")

# engine.js / data.js / victory-lines.js 以外はスキップ
case "$FILE_PATH" in
  *management.js|*match-engine.js|*relationships.js|*data.js|*victory-lines.js) ;;
  *) exit 0 ;;
esac

# まず構文チェック
if ! node --check "$FILE_PATH" 2>&1; then
  echo "[auto-sim] SYNTAX ERROR in $(basename "$FILE_PATH")" >&2
  exit 2
fi

# auto-sim 軽量実行（5シード × 20シーズン = 100シーズン）
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
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
  echo "[auto-sim] VIOLATIONS DETECTED after editing $(basename "$FILE_PATH"):" >&2
  echo "$RESULT" >&2
  echo "[auto-sim] Run 'node test/auto-sim.js 100' for details" >&2
  exit 2
fi

echo "[auto-sim] 100 seasons ALL CLEAR after editing $(basename "$FILE_PATH")" >&2
exit 0
