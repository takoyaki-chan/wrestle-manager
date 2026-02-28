# Lessons Learned

## Canvas 描画は innerHTML 設定後に実行すること
Canvas 要素は innerHTML に埋め込んだ後、`document.getElementById()` で取得して `drawRadarChart()` を呼ぶ。
HTML文字列内で描画は不可能。`showFighterPopup` では `buildPopup()` → `innerHTML = popupHtml` → `drawRadarChart(canvas, ...)` の順序が必須。

## サブタブ state はモジュールレベル変数で管理
`let _dbSubTab = 0` のようにファイルスコープ変数で状態管理。
onclick で `setDbSubTab(idx)` を呼び `renderDatabase()` を再呼び出しするパターン。

## `overlay.classList.add('active')` は複数箇所にあるため replace_all=false 時は一意な文脈が必要
ui-common.js の末尾追記では周囲のコードを十分含めて一意にすること。

## refreshAll() には新しいレンダラを追加すること
新しい画面を追加した場合は `refreshAll()` に `renderDatabase()` 等を追加。ただし常時呼ばれるため軽量に保つこと。

## Engine.database の getAllFighters は dormantPool 除外が必須
仕様書「dormantPool（出現待ち）は絶対に非表示」に従い、`state.dormantPool` は収集対象外。

## NPC の orgPop は state.aiOrgs[id].orgPop で取得（なければティアデフォルト値）
AI団体の orgPop は `state.aiOrgs?.[orgId]?.orgPop` に格納されている場合とない場合がある。
ない場合は tier に応じたデフォルト値（S=75, A=50, B=30）で代替。
