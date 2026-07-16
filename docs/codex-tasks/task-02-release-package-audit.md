# Codexタスク02: 配布パッケージの包含漏れ監査

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`
**成果物**: `docs/release-audit-report.md`(新規レポート1ファイルのみ。**既存ファイルは一切変更しない・コミット禁止**。修正が必要な場合もレポートに書くだけで、manifest等を勝手に直さない)

## 背景

DLsite/BOOTH向けzip配布は `release/package-release.ps1` + `release/manifest.json` で管理している。manifest未記載のファイルは配布されない=即バグ。過去メモに「`image/award-frame-*.png`(7枚)と `portrait-map.js` が未包含の可能性」という未確認の疑いが残っている。配布物の包含漏れを網羅的に監査したい。

## 調査内容

1. `release/manifest.json` と `release/package-release.ps1` / `release/verify-package.ps1` の仕組みを読む
2. **コード側が実行時に参照するファイルパスの全数調査**: `src/*.js` / `src/*.html` / `portrait-map.js` から、`../image/...`、`audio/`、`.webp/.png/.mp3/.ogg/.css/.js` 等のリソース参照を抽出(動的組み立てのパターン——例 `getStandUrl` の `stand_${key}.webp`——は、キー辞書を展開して実ファイル名に解決する)
3. 抽出した参照先それぞれについて (a) ファイルが実在するか (b) manifest に含まれるか、をマトリクスで判定
4. 逆方向も: manifest に載っているが実在しないファイル(配布スクリプトが落ちる原因)がないか
5. 特に重点確認: `image/award-frame-*.png` / `portrait-map.js` / 最近追加された `src/coach-lines.js` / `image/org/org-*.png` / `image/npc/` / `image/shachoshitsu/`

## レポート形式(docs/release-audit-report.md)

- 結論サマリ(漏れ N件 / 幽霊参照 N件 / manifest記載だが実在しない N件)
- 漏れ一覧テーブル(ファイル / 参照元コード行 / 影響=どの画面・機能が壊れるか)
- 参照されているが実在しないファイル一覧(コード側のバグ候補)
- 推奨する manifest 追記行(コピペ可能な形で。ただし適用はしない)

## 検証

- 判定はスクリプト(scratchpad可)で機械的に行い、レポートに手法を1段落で記す
- 誤検知が出やすい箇所(コメント内のパス、テストコード内のパス)は除外基準を明記
