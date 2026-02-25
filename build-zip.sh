#!/bin/bash
# WRESTLE MANAGER — ZIP配布パッケージ作成スクリプト
# 使い方: bash build-zip.sh
# 出力: wrestle-manager-v1.0.zip

set -e

VERSION="v1.0"
DIST_NAME="wrestle-manager-${VERSION}"
DIST_DIR="dist/${DIST_NAME}"
ZIP_NAME="${DIST_NAME}.zip"

echo "🏟️  WRESTLE MANAGER — ZIP配布パッケージ作成"
echo "================================================"

# Clean
rm -rf dist/
mkdir -p "${DIST_DIR}/src" "${DIST_DIR}/image"

# Copy game files
echo "📦 ゲームファイルをコピー中..."
cp src/index.html src/data.js src/engine.js src/app.js \
   src/ui-common.js src/ui-render.js src/victory-lines.js \
   src/battle-engine.html \
   "${DIST_DIR}/src/"
cp portrait-map.js "${DIST_DIR}/"

# Copy images
echo "🖼️  画像ファイルをコピー中..."
cp image/*.png "${DIST_DIR}/image/"

# Count files
SRC_COUNT=$(ls -1 "${DIST_DIR}/src/" | wc -l)
IMG_COUNT=$(ls -1 "${DIST_DIR}/image/" | wc -l)

# Create ZIP
echo "📦 ZIP作成中..."
cd dist/
zip -r "../${ZIP_NAME}" "${DIST_NAME}/" -q
cd ..

ZIP_SIZE=$(du -h "${ZIP_NAME}" | cut -f1)

echo "================================================"
echo "✅ 完了: ${ZIP_NAME} (${ZIP_SIZE})"
echo "   ソースファイル: ${SRC_COUNT}本"
echo "   画像ファイル: ${IMG_COUNT}枚"
echo ""
echo "📝 遊び方: 解凍後 ${DIST_NAME}/src/index.html をブラウザで開く"

# Clean temp
rm -rf dist/
