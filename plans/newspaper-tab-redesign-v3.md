# 新聞タブ独立 + v8モックアップ準拠リデザイン プラン

## Context

Phase 2/3 で実装した新聞・団体比較・因縁列伝の見た目が `docs/ui/mockups/newspaper-mockup-v8.html` と乖離しており、ユーザから差し戻し:
1. 新聞・団体比較・因縁列伝を「📰新聞」独立タブに統合 (DBから撤去)
2. 紙面幅 780px 統一
3. 全体を v8 モックアップ準拠に作り直し
4. 3面のスタンド画像が切れ気味 → 引き気味+OVR/年齢を画像下中央寄せ
5. バーレーダーのグラデが中途半端 → 単色化

## ユーザ確定事項

- 全 Phase A〜F を 1 セッション内で実装
- 「スタンド画像」=上半身画像 (`getUpperUrl`) のまま、box を引き気味にする
- DB 残サブタブ順: 全選手 / 全コーチ / 相関図 / (派閥) / 殿堂 / 年代記
- バーレーダーは単色 (左=金単色 `#9a7020`、右=赤単色 `#8b1a1a` で中央ライン)

## Phase A: タブ独立化

- `src/index.html` ナビバー: 「📊 データベース」の後に「📰 新聞」追加
- 同 HTML: `<div class="screen" id="screen-newspaper">` 新規 (内部に `#newspaperContent`)
- `src/ui-render.js`: `renderNewspaper()` 新設。3ページタブ(1面/2面/3面) + アーカイブナビ + ページ本文
- `src/app.js` showScreen で 'newspaper' 分岐 → `renderNewspaper()` 呼び出し
- DB側: `_dbSubTab` 配列から `2/5/8` 撤去、残り `[0,1,4,(7),3,6]`
- 既存 `_renderDbNewspaper` / `_renderDbOrgCompare` / `_renderDbRivalry` は流用するが renderNewspaper から呼び出す形に

## Phase B: 780px + sec-label 赤ピル化 + 共通CSS

`src/index.html` グローバルCSS:
- `.paper { max-width: 780px; margin: 0 auto; background: cream-gradient; box-shadow }`
- `.sec-label` 既存 (border-left灰) を v8 仕様に上書き: `display:inline-block;background:#8b1a1a;color:#fff;font-size:10px;font-weight:900;letter-spacing:4px;padding:3px 12px;margin-bottom:10px`
- `.sec-label-gold`: `background:linear-gradient(135deg,#b08530,#9a7020);color:#fff;...`
- `.page-nav-btn`: 角丸ピル (background ベージュ→active 時赤)
- `.kuroda-block` v8 仕様: `border-left:3px solid #5b4b34;border-radius:0 4px 4px 0;padding:10px 12px`
- 既存の `.db-cmp-vs-mark-circle / .org-bar-radar / .other-org-news-grid / .ndt-*` は1/2/3面で再利用、不要分は削除

## Phase C: 1面リデザイン (`_renderNewspaperPage1`)

v8 モックアップ L1145-1330 準拠:
- news-lead (赤左ボーダー intro)
- top-story: `grid-template-columns:200px 1fr` + 200×240額装 + EXCLUSIVEスタンプ + キャプションオーバーレイ + 24px見出し + sub バー + justify本文
- show-result: 130×130 fighter-card×2 + WINスタンプ + result-line(MQ大) + show-article + rating-block (★+headline+黒田コメント)
- digest-table: モックアップ準拠 num/tag/card(写真+名前 vs 名前+写真)/MQ/コメント別行
- sub-stories: 2col grid + kuroda-block + ファンの声
- preview セクション

## Phase D: 2面リデザイン (`_renderNewspaperPage2`)

v8 モックアップ L1330-1900 準拠:
- headline-section: 黒田顔 + 引用 + グレード(評価大文字)
- compare-select (ライバル選択ドロップダウン) — 既存ロジック流用
- org-summary 3列 (player/VS/rival) + tier badge + tags + stats grid + champion + trend
- war-record: 過去対戦成績(W-L+breakdown+streak chip+黒田コメント)
- ace-confront: 280px upper画像 横並び対峙 (左=そのまま, 右=`scaleX(-1)` flip), 中央 VS+メトリクス, 下に名前/OVR/階級バー, フレーバー
- matchup-list: 主力対決3件 (写真50px+名前+OVR / 中央 役割+verdict / コメント全幅下行)
- power-section: **単色バー** (.player-side `#9a7020` 単色, .rival-side `#8b1a1a` 単色) + 中央 1px ライン
- editorial: 黒田コラム
- brief-grid: 短信2件
- spotlight-grid: ライバル注目選手3件
- fan-section: ファンの声リスト

## Phase E: 3面リデザイン (`_renderNewspaperPage3`)

v8 モックアップ L1900-2470 準拠 + ユーザ指摘:
- rivalry-headline (大見出し+sub)
- rivalry-main:
  - photos: `grid 1fr 100px 1fr` + **240px → 280px に拡大** で引き気味、画像 `background-size:cover; background-position:center top`
  - VS+H2H バッジ
  - **info ブロックを 1fr/auto/1fr → 中央寄せ**: 各サイドを `text-align:center`、左右にも org / 名前 / 役割 / **OVR** / **年齢** を中央寄せで一通り表示
  - narrative (黒田叙述)
- rivalry-history: 時系列タイムライン
- rivalry-relations: 9象限 2col グリッド

## Phase F: 検証 + specs + roadmap + commit

- preview で各面巡回 inspect
- `specs/newspaper-and-orgcompare-spec-v2.0.md` を v3.0 にバージョンアップ (タブ独立 + 780px + ページ構造詳細)
- CLAUDE.md 索引更新
- roadmap 完了報告
- ローカルコミット

## 変更ファイル

| ファイル | 変更 |
|---|---|
| `src/index.html` | ナビボタン追加 / `#screen-newspaper` 追加 / 共通CSS全面書き直し (約400行) |
| `src/ui-render.js` | `renderNewspaper()` 新設 / `_renderNewspaperPage1/2/3` 新設 / DB側サブタブ配列縮小 / 旧 `_renderDbNewspaper/_renderDbOrgCompare/_renderDbRivalry` を新画面用に書き換え (約800行差分) |
| `src/app.js` | showScreen('newspaper') 分岐 |
| `specs/newspaper-and-orgcompare-spec-v2.0.md` | v3.0 に書き換え |
| `CLAUDE.md` | 索引バージョン更新 |
| `docs/game-system-roadmap.md` | 完了報告 |
