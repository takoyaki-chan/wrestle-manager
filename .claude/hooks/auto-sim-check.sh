#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
#  PostToolUse Hook: エンジン系ファイル編集後の軽量チェック
#  - 構文チェック(node --check)のみ即時実行
#  - auto-sim本体はターン終了時(Stopフック: auto-sim-stop.sh)に1回だけ走る
#    (feedback_auto_sim_policy: 編集のたびに回さない・一区切りで1回)
# ══════════════════════════════════════════════════════════════════════════════

INPUT=$(cat)

# node で file_path を抽出（Windows互換: stdinをパイプで渡す）
FILE_PATH=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log((j.tool_input&&j.tool_input.file_path)||'')}catch(e){console.log('')}})")

# エンジン系5ファイル以外はスキップ
case "$FILE_PATH" in
  *management.js|*match-engine.js|*relationships.js|*data.js|*victory-lines.js) ;;
  *) exit 0 ;;
esac

# 構文チェック（失敗は即フィードバック）
if ! node --check "$FILE_PATH" 2>&1; then
  echo "[auto-sim] SYNTAX ERROR in $(basename "$FILE_PATH")" >&2
  exit 2
fi

# dirtyフラグを立てる → Stopフックがターン末に1回だけauto-simを回す
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
touch "$PROJECT_DIR/.claude/hooks/.autosim-dirty"
exit 0
