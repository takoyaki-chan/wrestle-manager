#!/bin/bash
# WRESTLE MANAGER — ZIP配布パッケージ作成スクリプト
# 使い方:
#   bash build-zip.sh              # 全3種ビルド（製品版+BOOTH体験版+DLsite体験版）
#   bash build-zip.sh --all        # 全3種ビルド（同上）
#   bash build-zip.sh --release    # 製品版のみ
#   bash build-zip.sh --trial      # BOOTH体験版のみ
#   bash build-zip.sh --trial-dlsite  # DLsite体験版のみ

set -e

VERSION="1.07"
TRIAL_VERSION="v2"

# ── URL定数 ─────────────────────────────────────────────────────────────────
BOOTH_URL="https://takoyakichan.booth.pm/"
DLSITE_URL="https://www.dlsite.com/home/announce/=/product_id/RJ01592994.html"

# ── フラグ解析 ──────────────────────────────────────────────────────────────
BUILD_RELEASE=false
BUILD_TRIAL_BOOTH=false
BUILD_TRIAL_DLSITE=false

if [ $# -eq 0 ]; then
  # 引数なし → 全3種
  BUILD_RELEASE=true
  BUILD_TRIAL_BOOTH=true
  BUILD_TRIAL_DLSITE=true
fi

for arg in "$@"; do
  case $arg in
    --all)           BUILD_RELEASE=true; BUILD_TRIAL_BOOTH=true; BUILD_TRIAL_DLSITE=true ;;
    --release)       BUILD_RELEASE=true ;;
    --trial)         BUILD_TRIAL_BOOTH=true ;;
    --trial-dlsite)  BUILD_TRIAL_DLSITE=true ;;
  esac
done

# ── ビルド関数 ──────────────────────────────────────────────────────────────
# build_one <mode>  (mode: release | trial-booth | trial-dlsite)
build_one() {
  local MODE="$1"
  local IS_TRIAL_MODE=false
  local STORE_NAME=""
  local STORE_URL=""
  local ZIP_SUFFIX=""

  case $MODE in
    release)
      IS_TRIAL_MODE=false
      ZIP_SUFFIX=""
      ;;
    trial-booth)
      IS_TRIAL_MODE=true
      ZIP_SUFFIX="_Trial_${TRIAL_VERSION}"
      STORE_NAME="BOOTH"
      STORE_URL="${BOOTH_URL}"
      ;;
    trial-dlsite)
      IS_TRIAL_MODE=true
      ZIP_SUFFIX="_Trial_${TRIAL_VERSION}_DLsite"
      STORE_NAME="DLsite"
      STORE_URL="${DLSITE_URL}"
      ;;
  esac

  local DIST_NAME="WrestleManager_${VERSION}${ZIP_SUFFIX}"
  local DIST_DIR="dist/${DIST_NAME}"
  local ZIP_NAME="${DIST_NAME}.zip"

  echo ""
  echo "── ${MODE} ──────────────────────────────────────"
  if [ "$IS_TRIAL_MODE" = "true" ]; then
    echo "📋 モード: 体験版 ${STORE_NAME}（IS_TRIAL=true）"
  else
    echo "📋 モード: 製品版（IS_TRIAL=false）"
  fi

  # Clean
  rm -rf dist/
  mkdir -p "${DIST_DIR}/src" "${DIST_DIR}/image" "${DIST_DIR}/bgm"

  # Copy game files
  echo "📦 ゲームファイルをコピー中..."
  cp src/index.html src/data.js src/management.js src/match-engine.js \
     src/relationships.js src/app.js \
     src/ui-common.js src/ui-render.js src/victory-lines.js \
     src/battle-engine.html src/lz-string.min.js src/kuroda-text.js \
     src/draft-negotiation.js \
     src/battle-sfx.js src/battle-shared.css src/battle-anim.js src/battle-lines.js \
     src/tag-battle.html src/tag-battle-main.js src/tag-battle-lines.js \
     "${DIST_DIR}/src/"
  # ── IS_TRIAL フラグの書き換え（コピー後のファイルのみ） ──
  if [ "$IS_TRIAL_MODE" = "true" ]; then
    echo "🔒 体験版フラグを設定中（IS_TRIAL=true）..."
    sed -i 's/window\.IS_TRIAL = false/window.IS_TRIAL = true/' "${DIST_DIR}/src/index.html"
  fi

  # ── DLsite版: ストア参照をBOOTH→DLsiteに差し替え ──
  if [ "$MODE" = "trial-dlsite" ]; then
    echo "🔗 ストアリンクをDLsiteに差し替え中..."
    local UI_FILE="${DIST_DIR}/src/ui-common.js"
    # showTrialLimitMessage 内のテキスト
    sed -i 's|BOOTH で製品版をチェックしてください。|DLsite で製品版をチェックしてください。|g' "$UI_FILE"
    sed -i "s|\\\\nBOOTH で製品版をチェックしてください。|\\\\nDLsite で製品版をチェックしてください。|g" "$UI_FILE"
    # showTrialEndMessage 内のリンクとボタンテキスト
    sed -i "s|href=\"${BOOTH_URL}\"|href=\"${DLSITE_URL}\"|g" "$UI_FILE"
    sed -i 's|🛒 BOOTH で購入|🛒 DLsite で購入|g' "$UI_FILE"
  fi

  # Copy images (全サブディレクトリを一括コピー)
  echo "🖼️  画像ファイルをコピー中..."
  cp image/*.png image/*.webp "${DIST_DIR}/image/" 2>/dev/null || true
  for subdir in image/*/; do
    [ -d "$subdir" ] || continue
    local dirname
    dirname=$(basename "$subdir")
    mkdir -p "${DIST_DIR}/image/${dirname}"
    cp "$subdir"* "${DIST_DIR}/image/${dirname}/" 2>/dev/null || true
  done

  # Copy BGM files
  echo "🎵 BGMファイルをコピー中..."
  cp bgm/* "${DIST_DIR}/bgm/" 2>/dev/null || true

  # ── ゲーム起動用ショートカット＋README ──
  echo "📝 起動ファイル・README を生成中..."
  cat > "${DIST_DIR}/START.html" << 'REDIRECT_EOF'
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=src/index.html"><title>Wrestle Manager</title></head>
<body style="background:#1a1a2e;color:#eee;font-family:sans-serif;text-align:center;padding-top:100px">
<p>ゲームを起動中...</p><p><a href="src/index.html" style="color:#e8439f">クリックしても開かない場合はここをクリック</a></p>
</body></html>
REDIRECT_EOF

  # ガイド3種をコピー（ガイド01/02/03）
  for guide in "ガイド01-はじめの一歩.html" "ガイド02-さらに先へ.html" "ガイド03-パラメータ解説.html"; do
    if [ -f "$guide" ]; then
      cp "$guide" "${DIST_DIR}/${guide}"
      echo "📖 ${guide} を追加しました"
    else
      echo "⚠️  ${guide} が見つかりません（スキップ）"
    fi
  done

  cat > "${DIST_DIR}/README.txt" << 'README_EOF'
Wrestle Manager

【遊び方】
index.html をブラウザ（Chrome/Edge推奨）で開いてください。
インストール不要です。

※ うまく開かない場合は START.html をダブルクリックしてください。

【ガイド】
ガイド01-はじめの一歩.html … 初心者向けのスタートガイド
ガイド02-さらに先へ.html   … 慣れてきた人向けの発展ガイド
ガイド03-パラメータ解説.html … ステータス・システム解説ガイド

© takoyaki-chan
README_EOF

  # Count files
  local SRC_COUNT IMG_COUNT
  SRC_COUNT=$(ls -1 "${DIST_DIR}/src/" | wc -l)
  IMG_COUNT=$(ls -1 "${DIST_DIR}/image/" | wc -l)

  # Create ZIP（Windows: PowerShell / Linux: zip）
  echo "📦 ZIP作成中..."
  if command -v zip &>/dev/null; then
    cd dist/ && zip -r "../${ZIP_NAME}" "${DIST_NAME}/" -q && cd ..
  else
    powershell.exe -Command "Compress-Archive -Path 'dist/${DIST_NAME}' -DestinationPath '${ZIP_NAME}' -Force"
  fi

  local ZIP_SIZE
  ZIP_SIZE=$(du -h "${ZIP_NAME}" | cut -f1)

  echo "✅ 完了: ${ZIP_NAME} (${ZIP_SIZE}) — src:${SRC_COUNT} img:${IMG_COUNT}"

  # Clean temp
  rm -rf dist/
}

# ── メイン実行 ──────────────────────────────────────────────────────────────
echo "🏟️  WRESTLE MANAGER — ZIP配布パッケージ作成"
echo "================================================"

[ "$BUILD_RELEASE" = "true" ]       && build_one release
[ "$BUILD_TRIAL_BOOTH" = "true" ]   && build_one trial-booth
[ "$BUILD_TRIAL_DLSITE" = "true" ]  && build_one trial-dlsite

echo ""
echo "================================================"
echo "📦 全ビルド完了！"
ls -1h WrestleManager_${VERSION}*.zip 2>/dev/null || true
