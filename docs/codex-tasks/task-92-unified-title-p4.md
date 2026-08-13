# task-92: 全国統一王座 P4(記録・表彰・殿堂・MVPレース)

- 起票: 2026-08-13(Fable) / 設計承認: 同日Keisuke(数値・構成とも確定)
- 作業場所: 専用worktree `C:\Users\nkmrk\Downloads\wm-codex-task92`(mainのlinked worktree・ブランチ `codex/task-92-unified-title-p4`)。mainフォルダは触らない
- スコープ外: 試合・抽選・挑戦サイクルのロジック変更一切 / ベルト画像 / specs昇格(マージ後にFable)

## 1. 目的

統一王座の戦績を記録面に接続する: 個人記録(防衛/奪取)→殿堂ポイント・MVPレース・表彰式スライド・記録タブ・実績リスト。

## 2. 仕様の正

1. `docs/unified-title-p4-records-plan-v0.1.md`(承認版) — 数値と構成のすべて。**§1殿堂(奪取+2/防衛+2/天頂戦戴冠+0)・§1.5 MVP(防衛+20/奪取+20/年末保持+12/戴冠+0)が確定数値**
2. 既存実装の物差し: `Engine.awards.calcHofPoints`(management.js 20383付近)/`Engine.mvpRace.POINTS`+`calcSeasonPoints`(18918/18972付近)/`_collectFactChips`(19700付近)

## 3. 実装項目

### A. 個人記録(careerRecord)の追加

- `Engine.unifiedTitle.resolveMatch`: 防衛成功時に王者へ `{type:'unifiedTitle', result:'defense', season, week}`、奪取時に新王者へ `result:'captured'` を積む(現状の`_recordUnifiedWin`は奪取時も`'won'`を積んでいる — **奪取は`'captured'`へ変更**し、`'won'`は天頂戦授与経由専用に分離)。人気加算・unifiedTitle.history側は無変更
- 既存セーブは遡及しない

### B. 殿堂ポイント+実績リスト(対で実装)

- `calcHofPoints`: `type:'unifiedTitle'` の `result:'captured'`+2 / `'defense'`+2 / `'won'`+0
- `buildCareerHighlights`: 同じ経路で「全国統一王座 戴冠(第N代)」「全国統一王座 奪取」「全国統一王座 防衛N度」を実績リストへ(**片方だけ直すとズレる、の既存コメントの教訓どおり両者を対で**)
- `_collectFactChips`: 🌐チップ3種(「🌐統一王座防衛N回」「🌐統一王座奪取」「🌐現統一王者」)

### C. MVPレース

- `Engine.mvpRace.POINTS` に `UNIFIED_DEFENSE: 20` / `UNIFIED_CAPTURE: 20` / `UNIFIED_HOLD_AT_END: 12` を追加(**既存キーの値は一切変更しない**)
- `calcSeasonPoints`: 当季の `unifiedTitle` イベント(captured/defense)を加点、年末保持判定 `state.unifiedTitle?.championId === fighter.id` で+12。`'won'`は加点しない(天頂戦点が別枠で入る)

### D. 年間表彰スライド

- **非天頂戦年のみ**「今年の大会」部に「全国統一王者」スライド1枚: 年末時点の保持者(自団体/AI問わず)+在位年数+今年の防衛数。ベルト帯はP3の `.unified-beltband`(オーロラ)を流用
- 天頂戦年・空位の年はスライドを出さない(空位の説明文も出さない)
- 表彰の実績ポイント(団体スコア)への加点はしない

### E. 記録タブ(📜)

- 「全国統一王座」セクション新設: 歴代王者リスト(`G.unifiedTitle.history`から: 第N代・名前・団体・在位期間・防衛数・終わり方=返還/陥落/返上)+最多防衛・最長在位の2記録
- `G.unifiedTitle` が未創設(null/undefined)のセーブでは**セクションごと非表示**

## 4. 数値目標と不変条件(対。マージ前にFableが検算)

| 目標 | 不変条件 |
|---|---|
| 殿堂+2/2/0 | **I-1**: 統一イベントを含まないcareerRecordフィクスチャに対する`calcHofPoints`の返り値が変更前後で完全一致(既存係数の無変更をテストで固定) |
| MVP+20/20/12 | **I-2**: 統一イベントを含まない選手の`calcSeasonPoints`が不変(フィクスチャ)。POINTSの既存キー無変更 |
| 個人記録の追加 | **I-3**: 創設前は状態・乱数とも不変=実装前後で `node test/auto-sim.js 3 42` の出力が完全一致 |
| 表彰スライド | **I-4**: 表彰式の進行保証(onDoneちょうど1回・タイムアウト保険)。天頂戦年/空位年にスライドが出ないことをテストで固定 |
| 記録タブ | **I-5**: 未創設セーブで非表示・「残っていません」型の説明文を出さない |
| 較正条項 | **I-6**: `node test/auto-sim.js 100 7919` 1本で①殿堂レベル分布(★/★★/★★★人数) ②年間MVPに占める統一王者の比率、を導入前後で計測し**報告に含める**(判定はFable: ★★★が2倍超なら殿堂防衛2→1.5 / MVP比率9割超なら防衛20→16) |

## 5. 触ってよい / 触ってはいけないファイル

- **可**: src/management.js(§3のA〜C+表彰データ生成) / src/ui-common.js(表彰スライド) / src/ui-render.js(記録タブ) / test/(新規+追随)
- **不可**: src/match-engine.js / src/relationships.js / src/factions.js / src/app.js / src/data.js / 挑戦サイクル・試合ロジック / **新規srcファイル禁止**

## 6. 検証手順(すべてフォアグラウンド。run_in_background禁止)

1. 実装**前**に main HEAD で `node test/auto-sim.js 3 42` と `node test/auto-sim.js 100 7919` の出力を保存(I-3基準とI-6の導入前計測。ファイルはコミットしない)
2. `node --check` 対象全部 → `npm test` 全PASS(新規: フィクスチャテスト I-1/I-2/I-4/I-5)
3. `node test/auto-sim.js 3 42` → 手順1と完全一致(I-3)
4. `node test/auto-sim.js 20 42` → 違反0
5. `node test/auto-sim.js 100 7919` → 違反0 + I-6の計測値を導入前と並べて報告

## 7. 完了条件

- 2コミット目安(記録+ポイント / 表彰+記録タブ)
- 報告: 触ったファイルと行数規模 / I-1〜I-6自己申告 / I-6計測値(前後比較表)
