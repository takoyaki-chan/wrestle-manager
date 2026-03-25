#!/bin/bash
# WRESTLE MANAGER — ZIP配布パッケージ作成スクリプト
# 使い方:
#   bash build-zip.sh              # 製品版ビルド（IS_TRIAL=false）
#   bash build-zip.sh --trial      # 体験版ビルド（IS_TRIAL=true）
#   bash build-zip.sh --release    # 製品版ビルド（明示）

set -e

VERSION="1.0"
TRIAL_VERSION="v2"

# ── フラグ解析 ──────────────────────────────────────────────────────────────
IS_TRIAL_MODE=false
ZIP_SUFFIX=""

for arg in "$@"; do
  case $arg in
    --trial)   IS_TRIAL_MODE=true;  ZIP_SUFFIX="_Trial_${TRIAL_VERSION}" ;;
    --release) IS_TRIAL_MODE=false; ZIP_SUFFIX="" ;;
  esac
done

DIST_NAME="WrestleManager_${VERSION}${ZIP_SUFFIX}"
DIST_DIR="dist/${DIST_NAME}"
ZIP_NAME="${DIST_NAME}.zip"

echo "🏟️  WRESTLE MANAGER — ZIP配布パッケージ作成"
echo "================================================"
if [ "$IS_TRIAL_MODE" = "true" ]; then
  echo "📋 モード: 体験版（IS_TRIAL=true）"
else
  echo "📋 モード: 製品版（IS_TRIAL=false）"
fi

# Clean
rm -rf dist/
mkdir -p "${DIST_DIR}/src" "${DIST_DIR}/image" "${DIST_DIR}/bgm"

# Copy game files
echo "📦 ゲームファイルをコピー中..."
cp src/index.html src/data.js src/engine.js src/app.js \
   src/ui-common.js src/ui-render.js src/victory-lines.js \
   src/battle-engine.html src/lz-string.min.js src/kuroda-text.js \
   "${DIST_DIR}/src/"
cp portrait-map.js "${DIST_DIR}/"

# ── IS_TRIAL フラグの書き換え（コピー後のファイルのみ。元ファイルは変更しない） ──
if [ "$IS_TRIAL_MODE" = "true" ]; then
  echo "🔒 体験版フラグを設定中（IS_TRIAL=true）..."
  sed -i 's/window\.IS_TRIAL = false/window.IS_TRIAL = true/' "${DIST_DIR}/src/index.html"
fi

# Copy images (全サブディレクトリを一括コピー)
echo "🖼️  画像ファイルをコピー中..."
cp image/*.png image/*.webp "${DIST_DIR}/image/" 2>/dev/null || true
for subdir in image/*/; do
  [ -d "$subdir" ] || continue
  dirname=$(basename "$subdir")
  mkdir -p "${DIST_DIR}/image/${dirname}"
  cp "$subdir"* "${DIST_DIR}/image/${dirname}/" 2>/dev/null || true
done

# Copy BGM files
echo "🎵 BGMファイルをコピー中..."
cp bgm/* "${DIST_DIR}/bgm/" 2>/dev/null || true

# ── ゲーム起動用ショートカット＋README ─────────────────────────────────────────
echo "📝 起動ファイル・README を生成中..."
cat > "${DIST_DIR}/START.html" << 'REDIRECT_EOF'
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=src/index.html"><title>Wrestle Manager</title></head>
<body style="background:#1a1a2e;color:#eee;font-family:sans-serif;text-align:center;padding-top:100px">
<p>ゲームを起動中...</p><p><a href="src/index.html" style="color:#e8439f">クリックしても開かない場合はここをクリック</a></p>
</body></html>
REDIRECT_EOF

# スタートガイドをコピー
if [ -f "wm-guide.html" ]; then
  cp "wm-guide.html" "${DIST_DIR}/wm-guide.html"
  echo "📖 スタートガイドを追加しました"
elif [ -f "../WMポートレート/wm-guide.html" ]; then
  cp "../WMポートレート/wm-guide.html" "${DIST_DIR}/wm-guide.html"
  echo "📖 スタートガイドを追加しました"
else
  echo "⚠️  wm-guide.html が見つかりません（スキップ）"
fi

cat > "${DIST_DIR}/README.txt" << 'README_EOF'
Wrestle Manager

【遊び方】
index.html をブラウザ（Chrome/Edge推奨）で開いてください。
インストール不要です。

※ うまく開かない場合は START.html をダブルクリックしてください。

【ガイド】
wm-guide.html を開くと、初心者向けのガイドが読めます。

© takoyaki-chan
README_EOF

# Count files
SRC_COUNT=$(ls -1 "${DIST_DIR}/src/" | wc -l)
IMG_COUNT=$(ls -1 "${DIST_DIR}/image/" | wc -l)

# Create ZIP（Windows: PowerShell / Linux: zip）
echo "📦 ZIP作成中..."
if command -v zip &>/dev/null; then
  cd dist/ && zip -r "../${ZIP_NAME}" "${DIST_NAME}/" -q && cd ..
else
  powershell.exe -Command "Compress-Archive -Path 'dist/${DIST_NAME}' -DestinationPath '${ZIP_NAME}' -Force"
fi

ZIP_SIZE=$(du -h "${ZIP_NAME}" | cut -f1)

echo "================================================"
echo "✅ 完了: ${ZIP_NAME} (${ZIP_SIZE})"
echo "   ソースファイル: ${SRC_COUNT}本"
echo "   画像ファイル: ${IMG_COUNT}枚"
echo ""
echo "📝 遊び方: 解凍後 ${DIST_NAME}/src/index.html をブラウザで開く"

# Clean temp
rm -rf dist/
