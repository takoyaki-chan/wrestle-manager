# 💞 Bond/Rivalry 関係性システム設計書 v2.2 — 離脱・裏切りイベントパッケージ

> **ステータス**: 🟢 確定
> **作成日**: 2026-04-27
> **依存**: relationship-system-spec-v2.1.md（v2.1 を継承し、§5.2 退団系イベントを細分化）
> **追加実装箇所**: relationships.js (`applyContractDepartureBetrayal`, `checkFirstMeetSinceDeparture`), management.js (`processDeparture` 分岐, `Engine.title` reclaim helpers), app.js (奪還挑戦 UI/フロー, `_consumeBetrayalNews`), ui-render.js (奪還/空位バナー), data.js (NEWS_HEADLINE_TEMPLATES contractBetrayal\*)
> **指示書**: plans/relationship-events-betrayal-task.md（実装完了に伴いアーカイブ可）

---

## 概要

v2.1 の O-03（退団 → 同僚関係値ペナルティ）を、**「契約交渉決裂で AI 団体に行く＝裏切り」** イベントとして再設計。エース・宿敵団体・チャンピオンという 3 つの加重条件をサーチャージとして加算するモデルに変更し、王座持ち出し時のタイトル移送と奪還挑戦状システムまでを一連のドラマとして統合する。

---

## §A.1〜A.4 契約離脱サーチャージ（旧 O-03 細分化）

### 発火条件

`Engine.contract.processDeparture` 内、`determineDeparture` の戻り値が **`type: 'rival'`** の場合のみ A 系を発火。`'freeAgent'` / `'retire'` は v2.1 の既存挙動（bond −15〜−8 / rivalry +5〜+10）を維持。

### 加算モデル

| ID | 条件 | bond | rivalry | morale | orgPop | 備考 |
|----|------|:-:|:-:|:-:|:-:|------|
| A-1 | 必発火（ベース） | −20〜−12 | +8〜+15 | — | — | 全裏切りに常駐 |
| A-2 | 離脱選手がロスター内 OVR 1位（=エース） | −5〜−3 | +4〜+5 | −12〜−8 | — | A-4 と独立、両方該当時は累積 |
| A-3 | `Engine.orgWar.get(state, 'player', toOrgId).lastResult` が直近 24 週以内 | −6〜−5 | +7〜+10 | — | — | 直近の対抗戦/PPV/サミットを宿敵判定 |
| A-4 | 離脱選手が現王者（`titles.world.championId`） | −10 固定 | +12〜+15 | −15〜−10 | −5〜−3 | 内部 50% でベルト持ち出し（後段 §A.5）|
| A-4-持ち出し | A-4 発火 + RNG `0xBE73` で 50% | — | +5〜+10 追加 | — | — | 屈辱サーチャージ |

### キャップ

- `bondDelta >= -35`
- `rivalryDelta <= +35`

### 適用方法

残留選手（`!injury && !isRental`）全員に同一の delta を適用。`applyFromRoster(state, remainingIds, departingId, {min: bondDelta, max: bondDelta}, {min: rivalryDelta, max: rivalryDelta}, rng)` で `min === max` を渡し、roll は本ハンドラ冒頭で 1 回のみ。

### transient 出力

- `state._lastBetrayalSummary` — 新聞ヘッドライン分岐用（後段 §C.6）
- `state._lastBetrayalBeltCarried` — タイトル移送ハンドラの起動フラグ

### RNG シード

- `0xBE71` — A-1〜A-4 全体（ロール）
- `0xBE73` — ベルト持ち出し 50% 判定

---

## §A.5 ベルト持ち出し（A-4 後段）

`Engine.title.transferTitleToOrg(state, titleType, fighterId, toOrgId)` で実行。

### 効果

| 状態 | 値 |
|------|---|
| プレイヤー側 `titles[type].championId` | `null` |
| プレイヤー側 `titles[type].externalHolder` | `{ fighterId, orgId, transferredSeason, transferredWeek }` |
| AI 団体側 `aiOrgs[toOrgId].externalTitles[]` | エントリ追加 `{ titleType, championId, acquiredFromOrg:'player', acquiredSeason, acquiredWeek, lastDefenseWeek:null }` |

### 簡略案（§9-5 準拠）

- AI 同士のタイトル移動は **発生しない**
- AI 団体での自動防衛戦も **発生しない**
- 取り戻せるのは **プレイヤー団体からの奪還挑戦のみ**（後段 §C）

### 置いていき（A-4 持ち出し判定 50% で false 側）

`transferTitleToOrg` は呼ばれず、後段の自動空位ブロック（championId === fighter.id 時に championId=null）が発火。`externalHolder` は **未設定**のまま。プレイヤーは UI から王座決定戦を組める（§B.1）。

---

## §B.1 王座空位中の決定戦（A-4 置いていき / 通常空位）

新規 UI 動線ではなく、既存 `crownChampion`（championId=null での isTitle 試合 → 勝者が新王者）を流用。`renderShowPrep` に空位案内バナーを追加し、上位 2 名（`getEligibleChallengers` の上位 OVR 2 名）を「決定戦の候補」として明示する。

---

## §B.3 元同僚 vs 元同僚 初対戦

### 発火条件

`Engine.orgTimeline.checkFirstMeetSinceDeparture(state, idA, idB)` が真:

1. `wereColleagues(fighterA, fighterB)` — 過去同団体に在籍歴あり
2. `h2h.history` 内に「最も新しい同団体離脱週」より後の対戦エントリが **0件**

「同団体離脱週」 = orgTimeline overlap end（=`min(aEnd, bEnd)`）の最大値。

### 効果

| 方向 | bond | rivalry | 逓減 | cross-org 乗数 |
|------|:-:|:-:|:-:|:-:|
| AB | −3〜−1 | +6〜+10 | なし | **対象外**（`skipCrossOrgBondMult: true`）|
| BA | −3〜−1 | +6〜+10 | なし | **対象外** |

### 適用位置

`applyMatchResult` 内、cross-org キャップ（rivalry +35）の **直前**に挿入。v2.1 のクロス Org 乗数（×1.5 bond / ×2.0 rivalry）とは独立して固定値で動く。

### RNG

`0xBE72` を予約（現状の `apply()` ヘルパーは内部 rng を流用するため、明示シードは未使用。将来別系統が必要な場合に備える）。

---

## §C 奪還挑戦状システム

### §C.1 状態

- `G.titles.world.externalHolder: { fighterId, orgId, transferredSeason, transferredWeek }`
- `G.aiOrgs[orgId].externalTitles[]`
- `G.reclaimChallenges[]: { titleType, issuedSeason, issuedWeek, challengerFighterId, defenderFighterId, defenderOrgId, result: null|'win'|'lose', resolvedSeason, resolvedWeek }`
- `G._pendingReclaim: { titleType, challengerId }`（次興行で消費）

すべて lazy-init（未定義時は空配列/null として扱う）。明示マイグレーション不要。

### §C.2 発行条件（`Engine.title.canIssueReclaim(state, titleType)`）

すべての条件を満たす時のみ true:

1. `externalHolder` が存在する
2. 離脱から **12週**経過済み
3. 直近の `result === 'lose'` 挑戦から **12週**経過済み
4. `result == null` の pending 挑戦が存在しない

### §C.3 発行 UI

興行準備画面（`renderShowPrep`）冒頭に「🏆 持ち出された王座」バナー。状態別表示:

- 発行可能 → 「⚔ 奪還挑戦状を発行」ボタン → モーダルで挑戦者選択（自団体ロスターから OVR 降順、`!injury && !isRental && !forcedRest`）
- 発行済み → 「📜 挑戦状発行済み — 次の興行のメインで X vs Y」「取り下げる」ボタン
- CD 中 → 「挑戦可能まで残り N 週」

### §C.4 試合フロー

1. `executeShow` 冒頭で `_pendingReclaim` を消費 → AI defender を `isReclaim` 印で player roster に一時注入 → showCard slot 0 を奪還試合（`{isTitle: true, isReclaim: true, _reclaimDefenderId, _reclaimOrgId}`）に置換
2. 通常 title outcome ループは `m.isReclaim` をスキップ（`crownChampion` のすり抜け防止）
3. `applyMatchResult` の context は `isCrossOrg: !!m.isReclaim` で常に true（v2.1 cross-org 乗数 + B-3 が両方発火可能）
4. finalizeShow 専用ブロックで勝敗ディスパッチ:
   - 挑戦者勝利 → `Engine.title.resolveReclaimWin(state, titleType, newChampId)` (タイトル復帰 + AI側 externalTitles 削除 + 新王者人気 +5 逓減適用)
   - 挑戦者敗北 → `Engine.title.resolveReclaimLoss(state, titleType)` (12週CD発動)
5. defender を player roster から filter 除去、`_pendingReclaim` クリア

### §C.5 簡略案（§9-5 準拠）

- AI defender の試合中の状態変化（人気・成長）は temporary roster 上のみで AI org 側に反映しない（既存 intrusion パターンと同一の割り切り）
- 同時挑戦は不可（pending が存在する間は再発行不可）

### §C.6 新聞ヘッドライン分岐

`App._consumeBetrayalNews(neg)` を `_resolveContractChoice` / sudden_departure / listen 経路の 3 箇所から呼び出し、`G._lastBetrayalSummary` のフラグで以下を振り分け:

| type（NEWS_HEADLINE_TEMPLATES キー） | 条件優先順位 |
|------|------|
| `contractBetrayalChampCarry` | `isChampion && beltCarried` |
| `contractBetrayalChampLeave` | `isChampion`（持ち出さず） |
| `contractBetrayalRivalOrg` | `isRivalOrg`（A-3 単独） |
| `contractBetrayalAce` | `isAce`（A-2 単独） |
| `contractBetrayalGeneric` | A-1 のみ |

優先順位は上から評価（最初にマッチした type を採用）。複合条件（A-2 + A-3 など）は最上位のフレーバーを優先。

ヘッドライン消費後、`_lastBetrayalSummary` と `_lastBetrayalBeltCarried` を state から削除。

---

## §D 既存セーブ互換

すべて lazy init で扱うため、明示マイグレーションフラグは設けない:

- `G.titles.world.externalHolder` — 未定義時は null として扱う
- `G.aiOrgs[id].externalTitles` — 未定義時は `[]` として扱う
- `G.reclaimChallenges` — 未定義時は `[]` として扱う
- `G._pendingReclaim` — 未定義時は無効化（show prep で表示せず）

---

## §E 検証

- auto-sim 100シーズン × 5300週: 違反 0 / エラー 0 / ゲームオーバー 0（2026-04-27 ALL CLEAR）
- ブラウザプレビュー: バナー描画、奪還ダイアログ動作、ニュース 5 パターン分岐確認済

### 残検証項目

- A-4 ベルト持ち出し 50/50 分布の長期統計（明示的集計スクリプトは未実装）
- 奪還挑戦試合での AI defender 状態変化を AI org に反映する case の実装是非
- A-1 単独実測値 / A-1+A-4 持ち出し実測値の数値プロファイリング

---

## §F 既存仕様との関係

- v2.1 のクロス Org 乗数（×1.5 bond / ×2.0 rivalry）は **applyMatchResult 内**で発火。本タスクの A-1〜A-4 は **契約交渉決裂時**の processDeparture 内で発火し、適用パスが完全に分離している。
- B-3 は試合内発火のため v2.1 と同居するが、`skipCrossOrgBondMult: true` を渡し固定値で動く（仕様 §B.3）。
- v2.1 §5.2 の「O-03: 退団 — bond -15〜-8 / rivalry +5〜+10」は FA 行き / 引退時のみ残存。AI 団体行きは A-1〜A-4 で完全置換。
