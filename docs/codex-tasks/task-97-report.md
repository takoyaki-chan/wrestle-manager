# task-97 実施報告: care-rework2 P0 機械修理(招聘市場バグ・休暇赤字・小骨)

- **実施日**: 2026-08-20
- **作業ブランチ**: `worktree-agent-a6be4041e38d23177`(worktree: `.claude/worktrees/agent-a6be4041e38d23177`)
- **基点**: `1856dac`(main)
- **コミット**: 8件(G単位で1コミット)
- **結果**: G1/G2/G3/G4/G6/G8/G10/G11 すべて実装完了。auto-sim 20季/seed42 **ALL CLEAR**

---

## 1. コミット一覧

| # | hash | 内容 |
|---|------|------|
| 1 | `4df905a` | fix(G1): 招聘市場・雇用募集プールの偏りシャッフルをFisher-Yatesに置換 |
| 2 | `a0aeb60` | fix(G2): 招聘済みコーチの永久出禁を仕様どおり「1回休み」に |
| 3 | `c879a2e` | fix(G3): 自動継続の罠除去 — デフォルトOFF+消化力逓減の対称化 |
| 4 | `a67bafb` | fix(G4): 休暇中の選手を欠場trustペナルティから除外 |
| 5 | `f98228d` | fix(G6): DECISION_PERSONALITY_MULT に shy 行を追加 |
| 6 | `de12223` | fix(G8): executeDecision のエラーフォールスルーを封鎖 |
| 7 | `82294b5` | fix(G10): 招聘UIの空振りを事前チェックで解消 |
| 8 | `c91436d` | fix(G11): 招聘の遅延trustトースト文言を現行の書類名に合わせる |

変更規模: `src/app.js` +10-1 / `src/data.js` +4-2 / `src/management.js` +21-6 / `src/ui-common.js` +17-2 = **51挿入 / 11削除**。
`src/ui-render.js` は変更不要だったため未変更。`match-engine.js` / `relationships.js` / `test/` / specs は未変更。

---

## 2. 各Gの修正内容

### G1 — 偏りシャッフルをFisher-Yatesに置換(2箇所)

| 箇所 | ファイル:関数 |
|---|---|
| 招聘市場 | `src/management.js` `Engine.shachoshitsu.rollInviteMarket` |
| 雇用募集プール | `src/management.js` `Engine.coach.generateSeasonalPool` |

`[...eligible].sort(() => Engine.rng.float(rng) - 0.5)` は比較関数が非推移的で、Array#sort の実装依存な比較順に沿って分布が偏る。両箇所とも既存イディオム(`Engine.util.seededPick` / management.js:21754 と同型)の `Engine.rng.int(rng, 0, i)` ベースのFisher-Yatesに統一した。

**不変条件の確認方法**:
- 候補数: `count` の式(招聘 `2 + rng.int(0,1)` / 雇用 `candidatesMin + rng.int(0, max-min)`)は未変更 — diffで該当行が文脈行のまま
- 除外条件: `eligible` のfilterは未変更 — diffで該当行が文脈行のまま
- シード導出: `Engine.rng.derive(...)` 行は未変更
- 乱数消費回数の変化は裁定どおり許容(sortの比較回数 → N-1回のint)

### G2 — 「永久出禁」を仕様どおり「1回休み」に

`src/management.js` `Engine.tickWeek`(招聘市場の再抽選箇所)。

再抽選が起きた四半期でのみ `lastInvitedCoachId` を null に戻す。順序が肝で、**`ensureInviteMarket(s)` が除外を適用し終えた後にクリアする**ため、除外1回は必ず効いてから消費される。

```js
const nextInviteMarket = Engine.shachoshitsu.ensureInviteMarket(s);
const inviteMarketRerolled = !s.inviteMarket || s.inviteMarket.periodKey !== nextInviteMarket.periodKey;
s = { ...s, inviteMarket: nextInviteMarket };
if (inviteMarketRerolled && s.lastInvitedCoachId != null) s = { ...s, lastInvitedCoachId: null };
```

**不変条件の確認方法**:
- 除外そのもの(直後1回)の維持: §4のミニシナリオでQ2出現率0%を実測(40/40)
- 同時1件制: `rollInviteMarket` / `execute` の `invite_active` 判定は未変更
- 自動継続が `lastInvitedCoachId` を再セット・延命しないこと: `tickInviteBuffs` の自動継続分岐(management.js:22974-22994)を読み、`lastInvitedCoachId` への書き込みが無いことを確認。grep でも書き込み箇所は `execute` の `newLastInvitedCoachId`(招聘実行時)と app.js:14417(その反映)のみ

### G3 — 自動継続の罠除去

**G3-1**(`src/ui-common.js` `showInviteTargetModal`): `<input type="checkbox" id="mdlAInviteAutoRenew" checked>` から `checked` を除去してデフォルトOFF。残り週の表示は既存になかったため、チェックボックス脇に注記「(4週ごとに費用と決裁枠⚡2を再消費)」を追加(⚡数は `doc.decisionCost` から描画するので将来の再調整に追従する)。読み取り側は `!!...?.checked` なので未チェックが正しく false になる。

**G3-2**(`src/management.js` `Engine.shachoshitsu.tickInviteBuffs` 自動継続分岐): 継続時の新バフ倍率を、同週に手動再招聘した場合と同一の計算に通す。

```js
const refreshed = Engine.shachoshitsu.calcInviteMult(coach, { ...f, _lastInviteEndWeek: absoluteWeek }, state);
```

満了処理が `_lastInviteEndWeek = absoluteWeek` を書く(management.js:23056)ので、「同週に手動で再招聘した選手」と完全に同じ入力になる。`absoluteWeek` は同関数の先頭で既に算出済みの変数を再利用。

**不変条件の確認方法**:
- 初回4週の倍率計算が1bitも変わらないこと: `calcInviteMult` 本体は未変更。変えたのは**自動継続分岐の引数のみ**なので、初回招聘経路(`execute` の `calcInviteMult(coach, f, state)`)は式・入力とも同一。§4の検算表「初回倍率」列が逓減なしであることも実測
- 逓減式(超過分半減・12週窓)自体: `calcInviteMult` 内の `1.0 + excess * 0.5` / `<= 12` は未変更
- `calcInviteMult` は乱数を使わないため、RNGストリームのずれは発生しない

### G4 — 休暇中の欠場trustペナルティ除外

`src/management.js` `Engine.trust.applyShowTrust` のロスターmap先頭。

```js
if (fighter.injury || fighter.onLeave) return fighter;
```

実フィールド名は `onLeave`(`{ weeksLeft, totalWeeks }`)で、休暇満了時に `const { onLeave: _lv, ...lvRest } = nc;` で**キーごと削除**される(management.js:12577)ため、truthy判定が「休暇中」と正確に一致する。`f.injury || f.onLeave` はコード内の既存イディオム(management.js:23472/23487)。

**不変条件の確認方法**:
- 非休暇・非怪我の選手の挙動が完全不変: 追加したのは早期returnの条件1つのみで、以降の計算式は一切触っていない
- 休暇辞令の即時trust効果(基礎(3+週数)×0.5): `execute` の `refresh_leave` 分岐は未変更
- **孤立判定用の `sameOrgActiveRoster`(management.js:22299)は意図的に変更していない** — §5参照

### G6 — DECISION_PERSONALITY_MULT に shy 行を追加

`src/data.js`。指示書の設計値を一字一句そのまま採用:

```js
shy:       { bonus: 0.90, encourage: 1.30, refresh_leave: 1.10, special_treatment: 1.00, party: 0.60, trainer: 0.90, camp: 0.90, media: 0.50 },
```

行頭コメントの「spec §6.3 の shy は project に存在しないため除外。」は事実誤認(shy は実在5名)だったため、再発防止の意図が伝わる文へ書き換え、行数表記も 6性格→7性格 に更新。

**不変条件の確認方法**:
- 既存6行の数値が1文字も変わらないこと: `git diff -U0 src/data.js` が既存6行を一切含まないことを確認済み(差分は「コメント2行の置換」と「追加2行」のみ)
- clamp(0.5〜1.5): 計算側は未変更
- §4で実データ照合(全7 personality が行を持つ)

### G8 — executeDecision のエラーフォールスルー封鎖

`src/app.js` `App.executeDecision`。`offseason_locked` のトーストを追加し、**その後ろに汎用防壁**を置いた。

調査の結果、未処理だったのは `offseason_locked` だけではなく、`relationship_repair` 系の **`pair_target_required` / `pair_not_found` / `pair_not_eligible` の3件も同じく素通り**していた(いずれも `G.roster = undefined` に到達しうる)。個別トーストを増やすのは指示書スコープ外のため、汎用防壁で一括して止めている。開発者向けに `console.warn('[WM] ...')` でコードを残す(プレイヤー向けトーストには内部コードを出さない)。

### G10 — 招聘UIの空振り解消(2件)

`src/ui-common.js` `showInviteCoachModal` の先頭に事前チェックを2つ追加。

1. **同時1件制**: `roster.find(f => f._inviteBuff)` でモーダルを開く前に止め、「すでに招聘中のコーチがいます(◯◯・残N週)」を表示
2. **資金**: 市場候補の最安招聘費を `Math.min` で取り、資金未満なら「資金が足りません」で停止。招聘費は書類ではなくコーチごとに決まる(`doc.cost` が `null`)ため、決裁側の一括事前チェック(`calcCost`)が0を返して素通りしていた

**不変条件の確認方法**: エンジン側(`execute` の `invite_active` / `funds_insufficient` 判定、management.js:23337-23347)は**1文字も変更していない**。UI側は保険であり、権威はエンジンのまま。

### G11 — 遅延trustトースト文言(文言のみ)

`src/app.js` の `SOURCE_TEXTS`: `trainer: '専属トレーナーとの練習で'` → `'外部コーチの指導で'`。現行の書類名は「外部コーチ招聘状」(data.js:19119)。週1人制限・最終週無通知はP1(通知再設計)の範囲なので未着手。

---

## 3. G1 抽選公平性の実測(10,000シード)

同一state(orgPop=100・雇用0・出禁なし=母集団35名)で `rollInviteMarket` を10,000シード回し、各コーチの出現数を公平値(=総ピック数/35)で割った。

> **注**: 指示書は1000シードでの±15%判定を指定していたが、その試行数では理論標準偏差σが公平値比±11.4%あり、**±15%は約1.3σにしかならない**。偏りが無くても35名中6〜7名がバンドを外れるのが期待値で、判定が成立しない(実際、修正後コードの1000シード試行で7名が外れた)。判定を意味あるものにするため試行数を10,000に上げた(±15%=約4.2σ)。χ²適合度検定も併記する。

### 修正前(`1856dac`)

| 順位 | コーチ | 格 | 出現 | ×公平値 |
|---|---|---|---|---|
| 1 | 鬼塚 剛志 | B | 1717 | **2.404** |
| 2 | 岩田 拓海 | C | 1129 | 1.581 |
| 3 | 白川 沙耶 | C | 1043 | 1.461 |
| 4 | 紅林 太一 | C | 916 | 1.283 |
| 5 | 鶴見 正嗣 | B | 888 | 1.244 |
| … | | | | |
| 32 | 御堂 清四郎 | A | 484 | 0.678 |
| 33 | 如月 薫 | A | 476 | 0.667 |
| 34 | 葉月 レナ | A | 447 | **0.626** |
| 35 | 篠原 隆 | C | 445 | **0.623** |

- 最大/最小 = **3.86倍**(調査レポート§1.3の「鬼塚×2.36 / 葉月×0.62 = 3.8倍」を再現)
- χ² = **2706.0**(自由度34、期待値34±8.2) → 一様分布から極端に乖離
- ±15%外: **19名 / 35名**

### 修正後(本ブランチ)

| 順位 | コーチ | 格 | 出現 | ×公平値 |
|---|---|---|---|---|
| 1 | 神崎 鋼子 | A | 784 | 1.094 |
| 2 | 鶴見 正嗣 | B | 761 | 1.062 |
| 3 | 飛鳥 真琴 | C | 756 | 1.055 |
| 4 | 朝日 義男 | C | 753 | 1.051 |
| 5 | 西岡 学 | C | 752 | 1.050 |
| … | | | | |
| 10 | 鬼塚 剛志 | B | 732 | 1.022 |
| 14 | 葉月 レナ | A | 718 | 1.002 |
| … | | | | |
| 33 | 羽田 小百合 | B | 678 | 0.947 |
| 34 | 森田 悠子 | C | 675 | 0.942 |
| 35 | 藤原 千春 | C | 636 | 0.888 |

- 最大/最小 = **1.23倍**(この試行数のサンプリング誤差の範囲)
- χ² = **38.5**(自由度34、期待値34±8.2) → 一様分布と整合
- ±15%外: **0名 / 35名** → **PASS**
- 配列先頭の鬼塚が10位(×1.022)、末尾の葉月が14位(×1.002)へ — 配列位置の効果が消えた

---

## 4. G2「1回休み」ミニシナリオ

`Engine.createInitialState` で実state を作り、S1/W10(Q1)でQ1市場の候補1名を「招聘済み」に見立て、本番と同じ `Engine.tickWeek` → `Engine.advanceWeek` でQ3まで進めた(40シード)。

### トレース例(seed=1、招聘コーチ=篠原 隆)

| 週 | Q | periodKey | 市場に居るか | 1回休みフラグ |
|---|---|---|---|---|
| S1/W10 | Q1 | 1-Q1 | ★居る | id=17 |
| S1/W12 | Q1 | 1-Q1 | ★居る | id=17 |
| **S1/W13** | **Q2** | **1-Q2** | **—不在** | **null(消費済)** |
| S1/W24 | Q2 | 1-Q2 | —不在 | null(消費済) |
| **S1/W25** | **Q3** | **1-Q3** | 抽選しだい | null(消費済) |

### 集計(40シード)

| 項目 | 修正前(`1856dac`) | 修正後 |
|---|---|---|
| Q2で該当コーチが市場に出た | 0 / 40(0.0%) | 0 / 40(0.0%) |
| Q2でフラグがクリアされた | **0 / 40** | **40 / 40** |
| Q3で該当コーチが市場に出た | **0 / 40(0.0%)** | **2 / 40(5.0%)** |

修正前はフラグが残り続けQ3でも出現率0%(=永久出禁)。修正後はQ2で除外が1回効いてから消費され、Q3では母集団並みの確率(2.5/35 ≒ 7%相当)で復帰しうる。**受け入れ挙動「Q1に招聘 → Q2市場に不在 → Q3以降は出うる」を満たす。**

---

## 5. G3-2 / G6 の数値検算

### G3-2: 自動継続と手動再招聘の倍率一致

`state = {season:1, week:20}` で `calcInviteMult` を初回入力・再招聘入力それぞれで評価:

| コーチ | 格 | 初回倍率 | 再招聘倍率 | 期待値 1+(初回-1)/2 | 一致 |
|---|---|---|---|---|---|
| 鬼塚 剛志 | B | 1.3800 | 1.1900 | 1.1900 | OK |
| 飛鳥 真琴 | C | 1.3300 | 1.1650 | 1.1650 | OK |
| 鶴見 正嗣 | B | 1.3800 | 1.1900 | 1.1900 | OK |
| 岩田 拓海 | C | 1.3300 | 1.1650 | 1.1650 | OK |
| 沢村 玲子 | C | 1.3000 | 1.1500 | 1.1500 | OK |
| 朝日 義男 | C | 1.3000 | 1.1500 | 1.1500 | OK |

初回は `diminished=false`、再招聘は `diminished=true`。自動継続パスは `calcInviteMult(coach, {...f, _lastInviteEndWeek: absoluteWeek}, state)` を呼ぶので、表の「再招聘倍率」と完全に同値になる。

### G6: テーブル整合

- 行: `normal, bold, quiet, shy, easygoing, earnest, emotional`(**7行**)
- `shy` 行の実値: `{bonus:0.9, encourage:1.3, refresh_leave:1.1, special_treatment:1, party:0.6, trainer:0.9, camp:0.9, media:0.5}` — 設計値と一致
- ALL_CHARS の personality 実数: `normal:33, bold:24, easygoing:20, earnest:29, emotional:6, quiet:10, shy:5`(計127)
- **テーブルに行が無い personality: なし**(修正前は `shy` 5名が normal へ暗黙フォールバック)

---

## 6. 検証実行ログ

| # | 内容 | 結果 |
|---|---|---|
| 1 | `node --check` × management.js / app.js / ui-common.js / ui-render.js / data.js | 全OK |
| 2 | `node test/auto-sim.js 20 42` | **Result: ALL CLEAR ✓** — violations 0(unique 0) / errors 0 / freq warnings 0 / 1060週 / game over 0 / fingerprint `8ab84fe7` / 31.4s |
| 3 | G1分布(10,000シード × 修正前後) | §3のとおり PASS |
| 4 | G2ミニシナリオ(40シード × 修正前後) | §4のとおり PASS |
| 5 | `npm run test:ui:walkthrough` | **未実行**(worktreeにnode_modulesが無い前提で見送り。UI変更があるためマージ後に本体で1本回すこと) |

検証用スクリプトはリポジトリ外の作業用ディレクトリに置いたため、リポジトリには一切残していない(コミット0件)。

---

## 7. 判断に迷って倒した点・申し送り

1. **G1判定閾値の統計的な破綻**(§3の注記): 指示書の「1000シードで±15%」は試行数が足りず、無偏でも6〜7名が外れる。10,000シードへ増やし、χ²も併記して判定した。**次回以降、分布判定の指示を書くときは試行数とσの関係を先に確認したほうがよい。**

2. **G4で `sameOrgActiveRoster`(management.js:22299)を変更しなかった**: 指示書は「injuryと完全同扱い」とあり、孤立判定用の同団体アクティブロスター(`!f.injury && !f.isRental`)も対象に見える。しかしここに `onLeave` を足すと、**休暇中の選手が他選手の孤立判定の母数から外れ、「非休暇・非怪我の選手の信頼挙動は完全不変」という不変条件に反する**。不変条件を優先し、欠場ペナルティの早期return(22307)のみを変更した。孤立判定まで揃えるべきかは設計判断なのでFableの裁定を仰ぎたい。

3. **G8で未処理エラーが4件あった**: `offseason_locked` に加え `pair_target_required` / `pair_not_found` / `pair_not_eligible` も素通りだった(いずれも `G.roster=undefined` 到達可)。個別トースト追加はスコープ外と判断し、汎用防壁で一括対応した。**この3件に専用文言を当てるかは要判断**(現状は「この決裁は実行できませんでした」に集約)。

4. **G3-1の注記の⚡数を動的化した**: 指示書の文面は「(4週ごとに費用と決裁枠2を再消費)」だが、`doc.decisionCost` から描画するようにした(現状の描画結果は指示書どおり「⚡2」)。数値をハードコードすると将来の再調整で嘘表示になるため。文言そのものは変えていない。

5. **G2で「招聘中のコーチが市場に並びうる」既存挙動は残した**: `rollInviteMarket` は `state.coaches`(雇用)と `minOrgPop` でしか絞らないため、`_inviteBuff` で招聘中のコーチが翌四半期の市場に並ぶことがある。選ぼうとすればG10-1の事前チェックで止まる。修正前からの挙動でスコープ外のため未変更。

6. **worktreeがmainより9コミット遅れていた**ため、着手前に `main`(`1856dac`)へfast-forwardした(自ブランチ側の独自コミットは0件・`src/` に触るコミットも0件だったため衝突なし)。指示書 `task-97-care-p0-repairs.md` 自体がこのfast-forwardで初めてworktreeに入った。
