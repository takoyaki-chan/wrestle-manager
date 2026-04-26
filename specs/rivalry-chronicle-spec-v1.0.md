# 因縁列伝(3面) 仕様 v1.0

> 実装状況: 🟢 v1.0 実装済み（2026-04-25）
> 関連 handoff: `docs/archive/handoff-newspaper-rivalry-redesign-v1.md`
> モックアップ: `docs/ui/mockups/newspaper-mockup-v8.html`

## 1. 概要

データベース画面サブタブ「🔥 因縁列伝」(`_dbSubTab === 8`)。
H2H（対戦履歴）と Relationships（bond/rivalry）から、業界全体の濃い因縁ペアを抽出し、新聞3面風の叙述紙面として表示する。

「数字を見せず、関係性を言葉で伝える」紙面表現。9象限ラベルは内部分類のみで、紙面には叙述的見出し+本文だけが出る。

## 2. データ層

### 2.1 H2H 拡張

`Engine.h2h.update(h2h, leftId, rightId, winner, mq, isTitleMatch, isPPV, season, week, stage='show')`

末尾に `stage` 引数（`'show'|'war'|'ppv'`）を追加。
エントリに `history` 配列を追加：

```js
entry.history.push({
  s: season, w: week,
  st: stage,                     // 'show' | 'war' | 'ppv'
  win: 'A' | 'B' | 'd',          // ID 昇順での勝者側
  mq,
  t: 1?,                          // タイトル戦のとき
  p: 1?,                          // PPV のとき
});
```

上限50件（超過は先頭シフト）。`SAVE_TRIM.h2hHistoryMax = 50` でセーブ時にも切り詰め。

### 2.2 呼び出し箇所（7+1）

| ファイル | コンテキスト | stage |
|---|---|---|
| app.js タッグ | タッグマッチ | 'show' |
| app.js シングル | プレイヤー興行 | 'show' |
| app.js 対抗戦 | プレイヤー対抗戦 | 'war' |
| app.js PPV | PPV GRAND FINAL | 'ppv' |
| management.js AI興行 | AI団体内試合 | 'show' |
| management.js auto-sim タッグ | auto-sim タッグ | 'show' |
| management.js auto-sim シングル | auto-sim シングル | 'show' |
| management.js processAIWar | **AI vs AI 対抗戦**（新規） | 'war' |

## 3. 9象限分類（内部タグ）

`_classifyRelation(bond, rivalry)` で判定。`rivalry < 40` は `null`（紙面非表示）。

|  | bond ≥ 70 | bond 31-69 | bond ≤ 30 |
|---|---|---|---|
| rivalry ≥ 80 | `fated_admiration`（宿命の好敵手） | `destined_rival`（宿命のライバル） | `pure_hatred`（憎悪の宿敵） |
| rivalry 60-79 | `allied_rivalry`（盟友のライバル） | `standard_rivalry`（普通のライバル） | `bitter_feud`（不仲の因縁） |
| rivalry 40-59 | `mutual_respect`（互いを認める） | `casual_rivalry`（軽いライバル視） | `cold_rivalry`（反目しあう） |

**ラベル名は紙面に直接表示しない**（叙述見出しに変換）。

## 4. featured 選定（A+C ハイブリッド + 2週ローテーション）

`_pickRivalryFeatured(state)` で全 H2H ペアをスコア化、上位プールから **2週周期でローテーション** して featured を選び、残りスコア順上位6件を relations とする。

```
score = rivalry * 0.4
      + matches * 0.2
      + bestMQ * 0.2
      + |bond - 50| * 0.3   // 愛憎の振れ幅加点
      + (isPlayerInvolved ? 15 : 0)
      + dramaTagBonus[tag]   // pure_hatred:20 / fated_admiration:18 / bitter_feud:12
                             // allied_rivalry:10 / destined_rival:8
```

bond/rivalry は **双方向平均** を使う（`relAB.bond + relBA.bond` の平均）。

**ローテーション仕様**:
- スコア降順ソート後、`score >= topScore * 0.55` を満たすペアを上位プールに採用（最低3件・最大8件）
- 期間インデックス `period = floor(totalWeek / 2)`（`totalWeek = (season-1)*52 + week`）
- featured = `pool[period % pool.length]` で2週ごとに切り替わる
- relations は featured を除いた全候補のスコア上位6件
- 上位プールが1件しかない場合は実質固定（妥当）。試合で順位が動けば次サイクルから新ペアが入る
- シードに依存しない決定的ロジック（同セーブ・同週で同じ表示）

## 5. 紙面構造

1. **rivalry-headline** — 紙面タイトル（「因 縁 列 伝 / 数字の奥に宿る、選手たちの物語」）
2. **rivalry-main (featured)** — 暗背景パネル：
   - `rivalry-featured-headline`：象限別の叙述見出し（KURODA_RELATION_NARRATIVE.headlines）
   - `rivalry-main-photos`：左右スタンド画像対峙（**左のみ flip**）
   - `rivalry-main-info`：団体名/選手名/スタイル、中央に通算戦績
   - `rivalry-featured-body`：本文（KURODA_RELATION_NARRATIVE.bodies）
   - `rivalry-featured-facts`：◆通算 / ◆N年の付き合い / ◆最高 MQXX / ◆タイトル戦経験 / ◆PPV経験
3. **rivalry-history** — `history[]` 直近10戦を時系列で：stage バッジ（対抗戦/PPV/タイトル戦）+ S{N}W{W} + 勝者表示 + MQ。
4. **rivalry-relations** — 2カラムグリッド × 6枚。象限別 `border-left-color` で視覚区別、淡白ペア（rivalry<40）は出さない。

featured が見つからない場合は「記事にする価値のある因縁が、まだ業界には育っていない」エンプティステート。

## 6. フレーバー（KURODA_RELATION_NARRATIVE）

`src/kuroda-text.js` 末尾に定義。9象限タグ毎に `headlines` と `bodies` のテキスト関数配列。

- 主要4象限（`fated_admiration / pure_hatred / bitter_feud / allied_rivalry`）：各5本以上
- 残り5象限：各2本

文体は黒田幸子の **取材モード（深め）** — 感傷的・含蓄あり、ただし冷静さを保つ。お決まりフレーズ「本紙は」「〜と書いておく」「数字は嘘をつかない」「{years}年の付き合い」を2〜3割で散りばめる。

`pickText(pool, d)` に渡される narrative データ:
```js
d = {
  charA, charB,                  // 名前
  matches, bestMQ, years,        // 通算戦績、最高MQ、付き合い年数
  hadTitleMatch, hadPPV,         // 経験フラグ
}
```

## 7. CSS（src/index.html）

主要クラス:
- `.rivalry-wrap` `max-width:780px;margin:0 auto`
- `.rivalry-headline` `.title` `.sub`
- `.rivalry-main` 暗背景パネル + `.rivalry-featured-headline / -body / -facts`
- `.rivalry-main-photos` grid: 1fr/100px/1fr、`.ace-stand-img.flip` で `transform:scaleX(-1)`
- `.rivalry-history .history-row.{win-player|win-rival|draw}` で勝者色分け
- `.relation-card[data-tag="..."]` の象限別 `border-left-color`：
  - `fated_admiration: #d4a82a` / `pure_hatred: #6a0a0a`（背景赤味）
  - `destined_rival: #8b1a1a` / `bitter_feud: #5a1010`（背景赤味）
  - `allied_rivalry: #6a4a10` / `standard_rivalry: #8b6a30`
  - 残り3象限：穏やかな色相

@media(max-width:820px) でリレーションカードを1カラム化、スタンド高さ 240→180px。

## 8. やらないこと（明示的スコープ外）

- ❌ 試合内容（分秒・決まり手・観客反応）の表示・記録
- ❌ 因縁メーター（0-100の数値ゲージ）
- ❌ 「rivalry: 87」のような数値ラベル
- ❌ 9象限ラベル名（「宿命の好敵手」等）を紙面に直接表示
- ❌ 既存セーブのマイグレーション（新規記録から蓄積）

## 9. 実装ファイル

| ファイル | 内容 |
|---|---|
| `src/relationships.js` L2200 | `Engine.h2h.update` に stage + history[] |
| `src/app.js` L1467 / Storage.serialize | SAVE_TRIM h2hHistoryMax + history トリミング |
| `src/app.js` L6192 | buildShowResultData に `venueIdx` 付与 |
| `src/management.js` processAIWar | AI vs AI 対抗戦 h2h 記録 |
| `src/ui-render.js` _dbSubTab routing | サブタブ追加（idx 8）+ 派閥条件付き表示 |
| `src/ui-render.js` _renderDbRivalry 群 | 6 関数（_classifyRelation / _pickRivalryFeatured / _renderDbRivalry / _renderRivalryHeadline / _renderRivalryFeatured / _renderRivalryHistory / _renderRivalryRelations / _isPlayerSide / _findFighterOrgName / _buildNarrativeData） |
| `src/kuroda-text.js` | KURODA_RELATION_NARRATIVE（9象限） |
| `src/index.html` | `.rivalry-*` `.relation-card[data-tag]` CSS（約80行） |

## 10. 変更履歴

- v1.0 (2026-04-25): 初版実装。9象限分類 + history[] 駆動 + 黒田 narrative。
