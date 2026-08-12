# task-86: 派閥「開戦」画面リデザイン + 敵対度表記の全画面統一

- 起票: 2026-08-12(Fable) / 裁定: 同日Keisuke(全点確定・モックに刻印済み)
- 作業場所: `C:\Users\nkmrk\Downloads\wrestle-manager-codex`(ブランチ `codex/agent-workspace`)。mainフォルダは触らない
- 前提: **task-85(技画像)のWIPが同ツリーに残っている場合は先にコミットしてから着手**する(未コミット成果の巻き戻し事故防止)

## 1. 目的

派閥開戦(F02 ignite)画面を承認済みモックの姿へ全面改修し、あわせて敵対度の生数値・内部名露出を全画面からラベル表記へ統一する。人数表記バグとescHtml漏れ2箇所も同時に潰す。

## 2. 仕様の正(この順に読む。指示書内に仕様を二重記載しない)

1. `docs/ui/mockups/faction-ignite-rework-v0.1.html` — **画面の正**。「案A(推奨)」ビュー=完成形。「判断メモ」ビュー=裁定一覧(全点確定済み)。「敵対度の見せ方 統一案」ビュー=6箇所の置き換え文言表
2. `docs/dialogue/faction-ignite-and-challenge-lines-draft-v0.1.md` — セリフの正(場面1=宣戦21本/場面2=応戦21本。**承認済み・一字一句変更禁止**)。場面3はtask-87の管轄
3. `docs/ui/mockup-baseline-v0.1.md` §2(梯子)/§2-B(隊列)/§3(吹き出し)/§4(縦順)
4. `docs/ui/01-foundations.md` §1-6 原則11(全画面セレモニー級は節目専用)

## 3. 実装項目

### A. 赤トークン新設

`src/index.html` の `:root` に追加(**--accent-hostility系は一切変更しない**。橙の再振り分けは別タスク):
```css
--accent-war: #e04343;        /* 開戦・宣戦級の稀少演出専用の火の赤 */
--accent-war-rgb: 224,67,67;
--accent-war-hi: #ffb3a3;     /* 赤のハイライト(見出しグラデ上端・強調文字) */
```
用途は開戦画面のみ。他画面へ波及させない。

### B. 開戦モーダルの改修(`showFactionF02IgniteModal`, src/ui-common.js 11119付近)

モック案Aの構造へ。要点(詳細はモックのCSS/DOMを正とする):
- 画像: 220×260 cover → **梯子L 150×224**(2:3)。派閥フラグは画像下端のオーバーレイのまま
- **吹き出し新設**: 各リーダーの画像の上。クリーム地黒文字・尻尾は画像の水平中心・2行クランプ。**名前・所属を吹き出し内に書かない**(名前は既存の`.fevt-leader-name`が持つ)
- **敵対度**: 左右の生数値(`_fmtStat`小数2桁)を廃止し、**中央に1つ**「両派の対立」ラベル+段位(getHostilityLabel、src/factions.js:89-95)+**火ゲージ🔥×5**(点灯数=段位番号: 冷え込み1/小競り合い2/抗争3/泥沼4/血みどろ5)。判定値は**両方向hostilityの高い方**
- **頭数**: 「N名」+**upperチップ46×66の隊列**(-6px重ね)。※モックはface画像で組んであるが、**実装はgetUpperUrl(2:3素材)を使う**こと — 1:1のfaceを2:3枠にcoverすると素材系統違反(faceout-audit v0.2で解消した型)。画像が無い生成選手はイニシャルフォールバック
- **カード帯**: 「派閥抗争 ・ 直接決戦」→「**両派リーダー ・ 一騎打ち**」
- **ledger廃止**: 「相互敵対度+12/対戦マッチ数1→2/MQ期待値+8/集客見込み+6%」の4行と`.fevt-ign-ledger*`CSSを削除し、定性2行(`.ign-facts`型)へ: 「両派の対立は、後戻りできない段階に入った」「この一戦は公式戦として記録される」
- 配色: 既存の橙(--accent-hostility)参照とハードコード(#b09ad0/#d4a070/#ffd4a8等)を**--accent-war系トークン**へ。verdict地の文は現行文言のまま
- F02②peace/③resolutionの画面は**今回触らない**(ledgerの飾り数字は残っていてよい。別途)

### C. 人数表記バグの修正(src/factions.js `checkF02IgniteTrigger` 2439-2472付近)

現状 `membersA/membersB` が**氏名配列**で返り、モーダルが素通しで「派閥人数 東條,西島,…」と表示される。戻り値に `memberIdsA/memberIdsB`(ID配列)と `memberCountA/memberCountB` を**追加**し(既存フィールドは互換のため残す)、UI側はそれを使う。**発火条件・applyF02IgniteResult(+12)は一切変更しない**

### D. 宣戦・応戦セリフの焼き込み(src/data.js)

- 新テーブル `FACTION_IGNITE_LINES = { provoke: {...}, respond: {...} }`。第一階層はprovoke/respond、第二階層は**archetype単軸7種**(`standard/ojousama/cool/delinquent/polite/composed/seductive`)、各3本。草案の場面1/場面2を**一字一句そのまま**
- `EVENT_LINES_BY_KEY` に `factionIgniteProvoke` / `factionIgniteRespond` を登録し、Nodeエクスポートにも追加(セリフ編集ブックの往復に載せるため。task-44のheatSelf/heatCoachと同型)
- 選択はリーダーの`archetype`で引き、欠落キーは`standard`へフォールバック。乱数は`Engine.rng.derive()`のローカルRNG(GameState不変)

### E. 敵対度表記の統一(6箇所。文言はモックの「統一案」ビューの表が正)

1. 開戦画面(Bで対応済み)
2. F08決裁ヘッダ(ui-common.js 10475付近): `HOSTILITY {n} / 100` → 「{label}の対立」型
3. F08本文(10498付近): `敵対度 {n}/100` → ラベル文
4. F08選択肢Bヒント(10513付近): 内部閾値の直書き → 定性文言(**実挙動=仲裁不能条件80/70は変えない。文言だけ**)
5. F06ヘッダ(10183付近): `FORMER RIVALS ・ HOSTILITY {n} / 100` → 「かつての因縁 ・ {label}」
6. DB派閥タブ(ui-render.js 12292-12294/12321-12323付近): `F02 ・ IGNITE`/`F08`/`F09`のタイムライン表記→「開戦」「直接対決」「対抗戦」、「F09 発火圏/接近中」バッジ→「対抗戦の機運/接近中」

### F. 付随修正

- F09ナレーションのescHtml漏れ2箇所(ui-common.js 10890/11046付近の`String(...)`直埋め)→ escHtml経由へ

## 4. 数値目標と不変条件(対。マージ前にFableが1つずつ検算する)

| 目標 | 不変条件 |
|---|---|
| 開戦画面から敵対度の生数値を消す | **I-1**: `factionHostility`の値・加算(+12)・週次減衰・発火条件は無変更。**同一シードのauto-sim fingerprintが変更前後で完全一致**すること(表示層+戻り値フィールド追加のみ。乱数消費を1回も増やさない — セリフ選択はderiveローカル) |
| ラベル表記へ統一 | **I-2**: `getHostilityLabel`の閾値・文言は無変更(既存関数をそのまま呼ぶ。複製・再実装禁止) |
| F08ヒントの内部閾値文言を消す | **I-3**: F08選択肢の実挙動(B仲裁のdisabled条件・A/Cの効果)は無変更 |
| セリフ42本焼き込み | **I-4**: 草案と一字一句一致(テストで草案MDをパースして突き合わせる。heat-lines-test.jsの方式) |
| 人数バグ修正 | **I-5**: `checkF02IgniteTrigger`の発火判定ロジックに差分がない(戻り値フィールドの追加のみ) |

## 5. 触ってよい / 触ってはいけないファイル

- **可**: src/ui-common.js / src/ui-render.js / src/index.html / src/factions.js(checkF02IgniteTriggerの戻り値追加のみ) / src/data.js(セリフテーブル追加のみ) / test/(新規+既存の追随)
- **不可**: src/management.js / src/match-engine.js / src/relationships.js / src/app.js / 既存セリフテーブルの改変 / --accent-hostilityの定義変更 / F02②③・F09の画面構造(escHtml以外)

## 6. 検証手順(すべてフォアグラウンド。run_in_background禁止)

1. `node --check` 触ったJS全部
2. 新規 `test/faction-ignite-rework-test.js`: ①FACTION_IGNITE_LINESが草案MDと全文一致(42/42) ②開戦モーダルHTMLに数字の敵対度が出ない(禁止パターン `敵対度\s*\d` / `HOSTILITY`) ③ledger文言が消えている ④memberIds経由でチップがN個出る ⑤F09 narrationがescHtml済み
3. 既存テストの追随: `grep -l "fevt-ign\|HOSTILITY" test/` で該当を洗い、**振る舞い検査へ**書き換え(ソース文字列固定はしない)
4. `npm test` 全PASS
5. `node test/auto-sim.js 20 42` — 変更前(WM_SOURCE_REF=HEAD)と後で **fingerprint完全一致**(I-1)。一致しなければ乱数消費が増えている=設計違反なので原因を直す

## 7. 完了条件

- コミットは3粒度: ①データ(セリフ42本+テーブル登録) ②エンジン(factions.js戻り値追加) ③UI+CSS+テスト
- diffはこの指示書の範囲のみ。worklog/roadmapはFableがマージ時に書く
