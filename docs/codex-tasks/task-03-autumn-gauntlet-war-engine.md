# Codexタスク03: 4団体勝ち残り対抗戦(E-4) エンジン実装

**対象リポジトリ**: `C:\Users\nkmrk\Downloads\wrestle-manager`
**変更してよいファイル**: `src/management.js` / `src/data.js` / `test/auto-sim.js` の3つのみ。
**変更禁止**: `src/app.js` / `src/ui-*.js` / `src/index.html` / `src/match-engine.js`(UIは別作業者が並行開発中。衝突防止のため絶対に触らない)
**コミットはOK**(日本語の明確なメッセージで)。**pushは禁止**。

## 背景

女子プロレス団体経営SLG。年間カレンダー企画「アーク5」の第2弾として、Q3末(第36週)に年1回の特別イベント「4団体勝ち残り対抗戦」を実装する。第1弾「春のタッグリーグ」のエンジンは実装済みで、**本タスクはその実装パターンを強く踏襲する**。

## 必読(実装前にこの順で読む)

1. `CLAUDE.md` — アーキテクチャ5原則(Engine純粋関数/GameState返却値更新/乱数シード一元管理/tickWeek統合)。プレイヤー向け文言に内部変数名(morale/orgPop/MQ/condition等)を出さない規則も必須
2. `specs/autumn-gauntlet-war-spec-v0.1.md` — 本タスクの仕様書(全文)
3. `src/management.js` の `Engine.springTagLeague` — **先行実装の雛形**。announce/entry/run/apply の週次分割、advanceWeek へのフック位置(週10-12ブロック)、ポイント・賞金・careerRecord・ニュースの反映方法をそのまま踏襲する
4. `src/match-engine.js` の `Engine.wear` — 連戦消耗モジュール(実装済み・変更禁止、使うだけ)
5. `Engine.juniorTournament` と JTの `jtCarryHpPct`/`_hpOverride` — シングル戦の消耗持ち越しの既存手段

## 実装仕様

### 週次タイムライン(advanceWeek 内、springTagLeague ブロックの直後に追加)

| 週 | 処理 |
|----|------|
| 34 | `Engine.autumnWar.announce(state)` — 4団体のシード確定(団体ランキング1位vs4位/2位vs3位)+AI3団体の3名自動選出+業界ニュース |
| 35 | `autumnWarPhase='entry'` をセットするだけ。**weekPhaseは奪わない**(春リーグと同じ。'manage'以外が残留すると今週画面がロックされるため)。未編成でも週36の run() が自動編成で自己修復 |
| 36 | `run(state, rng)` → `apply(state, result)` — 準決勝2試合+決勝1試合を一括実行 |

### チーム・勝ち抜きルール(spec §1-§2, §4)

- 各団体3名(先鋒/中堅/大将)。プレイヤーは3名+並び順を指定(`confirmPlayerTeam(state, memberIds, order)`)。AIはOVR上位3名、並びは基本OVR昇順(大将=最強)+決定論的乱数で中堅⇔大将を時々入れ替え
- チーム戦: 先鋒同士から開始。敗者脱落、勝者は消耗を持ち越して連戦。3名全滅で敗退(最大5フォール)
- 引き分けフォールは両者脱落。最終フォールが引き分けで両軍全滅した場合は「勝ち抜き数が多い方」→同数なら決定論的乱数で勝者決定(仕様未定箇所の暫定ルール🔧、報告に明記)
- 決勝: **3名全員復帰**(脱落は当該チーム戦内のみ)。準決勝で戦った選手は消耗を持ち越し(+15回復後)。並び順は組み直し可(エンジンAPIとして `reorderForFinal(state, order)` を用意。auto-simは残存conditionの高い順)
- 試合はシングル戦(`Engine.battle.simulateMatch`)。JTと同じ `_hpOverride` 方式で開始HPに消耗を反映

### 消耗(spec §3 — Engine.wear を使用)

- 初期 condition 80 / **フォール間回復 0** / チーム戦間(準決→決勝) +15 / floor 40
- `wear = Engine.wear.calc(Engine.wear.hpRatio(勝者の残HP, 満タンHP))` — シングル戦の満タンHPの算出方法はJTの実装を確認して合わせる
- roster本体のconditionには影響しない(イベント内限定・怪我なし)。試合ごとの wear / conditionAfter を結果オブジェクトに記録(後続UIの布陣ボードが使う)

### ポイント・報酬(spec §5 — 全て仮確定値)

- `BATTLE_POINT_CFG.autumnWar = { semiWin: 6, semiLoss: -6, finalWin: 8 }`(決勝敗者は±0)
- `ACHIEVEMENT_CONFIG.pt.autumnWar = 10`、アイテムID `autumnWar_${season}`(優勝団体)
- orgPop(プレイヤー結果基準): 優勝+4 / 準優勝+1 / 準決勝敗退-2
- 賞金(プレイヤーのみ): 優勝¥1,200万 / 準優勝¥500万
- 殿堂(`calcHofPoints`): `type:'autumnWar'` の history から 勝ち抜き1勝×1.5 + 優勝チーム在籍+2 + 3人抜き以上+2
- `careerRecord.history`: 出場12選手全員に `{ type:'autumnWar', season, result:'champion'|'runnerUp'|'semiFinal', wins:勝ち抜き数 }` を1エントリ(春リーグの applyHistoryForOrg パターン踏襲)
- 大会MVP: 最多勝ち抜き(タイは優勝チーム優先→決勝での勝ち抜き数優先)。人気+5🔧
- `warThisSeason` フラグとは独立(既存対抗戦の年1回制限を消費しない)。`orgWarRecord` への記録は今回はスキップし、報告に「未接続」と明記

### GameState

`autumnWar: {phase, teams, bracket, results, mvpId, ...}` / `autumnWarPhase`。initialState に null 初期値を追加。既存セーブにフィールドが無くても安全に動くこと(説明文を出したりしない)。

### ニュース(data.js `NEWS_HEADLINE_TEMPLATES`)

`autumnWarAnnounce` / `autumnWarResult` を各2案。事実記述・格言禁止。週表記は「第36週」形式(「Week36」は禁止)。3人抜き達成時は結果ニュース本文に一文追加してよい。**文面は全文を報告に含める(レビューされる)**。`Engine.newspaper.PRIORITY` への登録も春リーグ(springTagResult: 230/springTagAnnounce: 150)に準じて追加(例: 240/150)。

### auto-sim対応(test/auto-sim.js)

- `autumnWarPhase==='entry'` でOVR上位3名+デフォルト並び順で自動確定(春リーグの springTagPhase==='entry' ブロックの直後に追加)
- 週36は対抗戦興行が枠を占めるため通常興行をスキップ(週12の `springTagOccupiesThisWeek` ガードと同型)
- 統計: 完走/不開催カウントを追加(春リーグと同型)

## 検証(完了条件)

1. `node --check` が3ファイルとも通る
2. `node test/auto-sim.js 100 42` と `node test/auto-sim.js 100 7919` が **ALL CLEAR**(violations 0)
3. 4団体勝ち残り対抗戦の完走率が 1.00/シーズン付近であること
4. 既存対抗戦(rivalry war)の発生頻度が従来レンジ(0.75-1.00/シーズン)から外れていないこと
5. 春のタッグリーグの完走率が引き続き 1.00 であること(リグレッションなし)

## 報告事項

(1)変更ファイルと行数 (2)追加したEngine APIの一覧 (3)引き分け全滅時の暫定ルールの実装内容 (4)ニュース文面の全文 (5)auto-sim結果(上記5項目) (6)仕様と違う判断をした箇所 (7)orgWarRecord未接続の旨
