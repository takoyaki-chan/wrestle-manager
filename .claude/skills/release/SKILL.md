---
name: release
description: DLsite/BOOTH向け配布zipのパッケージ生成と検証。「梱包して」「配布用zip」「リリース作業」「パッケージ」と言われたら必ずこのスキルを使う。手動梱包・GUIツール梱包は禁止。
---

# /release — 配布パッケージ生成・検証

DLsite/BOOTH向けzip配布は**必ずこのフロー経由**。手動梱包・GUIツール梱包は禁止。

## 手順

1. **バージョン確認** — `release/manifest.json` の `"version"` が今回の配布バージョンになっているか確認。違えば更新(スクリプトはここからバージョンを読む)
2. **パッケージ生成**
   ```powershell
   .\release\package-release.ps1
   ```
   - **manifest未記載ファイルの警告が出たら必ず内容を確認する**。manifestに載っていないファイルは配布されないため、新規追加ファイルの載せ忘れは即バグ
3. **検証**
   ```powershell
   .\release\verify-package.ps1 -ZipPath .\release\dist\WrestleManager_<version>.zip
   ```
4. **報告** — 検証チェックリストの結果を全項目報告する。すべてOKなら「DLsite/BOOTHへの差し替えはKeisukeの作業」と明記して引き渡す

## 注意

- 新規JS/CSS/アセットを追加した直後の配布では、`release/manifest.json` への追記漏れを最初に疑う
- release/dist/ 配下は .gitignore 済み。コミットしない
