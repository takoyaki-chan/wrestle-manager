# 選手経歴年表 仕様書 v1.0

最終更新: 2026-04-27 (Phase A〜E 全実装完了)

## 概要

選手ポップアップ「戦績・経歴」タブで描画される **キャリア年表** の仕様。`fighter.careerRecord.history[]` に蓄積されたイベントを `Engine.milestone.get(G, fighterId)` でマイルストーン形式に変換し、シーズン別折りたたみ + 行ごとに「アイコン + テキスト + 詳細(任意)」で表示する。

ゲームの魂(CLAUDE.md 三本柱「キャラクターの人生を覗き見る」)を支える中核 UI。

---

## 1. データモデル

### 1.1 fighter.careerRecord

```js
{
  history: HistoryEvent[],     // 時系列イベント配列
  totalTitleWins: number,
  totalDefenses: number,
  peakOVR: number,
  peakOVRSeason: number,
  peakPopularity: number,
  peakPopularitySeason: number,
  juniorTournamentWins: number,
  juniorTournamentAppearances: number,
  ppvMainEventWins: number,
}
```

### 1.2 HistoryEvent 共通フィールド

すべての type 共通:
- `type: string` — イベント種別(下記カタログ)
- `season: number`
- `week: number` (1〜48、ない場合は 0 や 24 などの妥当値で代替)

加えて type 固有のフィールドを持つ。

---

## 2. type カタログ

### 2.1 入団・退団・移籍

| type | 発火 | 主要フィールド | 年表テキスト例 |
|---|---|---|---|
| `debut` | 新規契約(draft/FA/scout) | `via`, `orgId?`, `orgName?` | 「ドラフト入団」「FA入団」「スカウト入団」 |
| `transfer` | 引き抜き / 交渉成立 | `toOrg`, `via` (poach / poach_forced / negotiate) | 「TOKYOへ移籍」+「引き抜きで加入」 |
| `release` | プレイヤー解雇 | `fromOrg` | 「KINGSを解雇」+「ロスター調整等により契約解除」 |
| `contractEnd` | 契約交渉決裂で退団 | `fromOrg`, `destinationType`, `destinationOrg` | 「TOKYOを契約満了で退団」+「フリーエージェントへ」 |
| `suddenDeparture` | 突然の退団イベント | `fromOrg`, `destinationType`, `destinationOrg` | 「BLITZを突然退団」+「KINGSへ移籍」 |
| `retire` | 引退 | `age`, `reason` (age / injury_wear / injury_career_ending) | 「引退（33歳）」+「年齢による引退」 |
| `retireRetracted` | 引退撤回 | `orgName` | 「引退を撤回し KINGS に復帰」 |
| `rentalIn` | レンタル加入 | `fromOrg`, `toOrg`, `seasons` | 「KINGSから GLOW へレンタル加入（2期）」 |
| `rentalOut` | レンタル期間満了で帰団 | `fromOrg`, `toOrg` | 「レンタル期間満了で KINGS へ帰団」 |

### 2.2 タイトル・トーナメント

| type | 主要フィールド | 年表テキスト例 |
|---|---|---|
| `titleWin` | `beltId`, `orgName`, `defeatedName?` | 「GLOW王座 獲得」+「美鈴 を破ってチャンピオンに」 |
| `titleLoss` | `beltId`, `orgName`, `defenses`, `dethronedByName?` | 「GLOW王座 陥落」+「白井 に敗れ陥落・12度防衛の末に陥落」 |
| `titleDefense` | `beltId`, `orgName`, `count`, `lastChallengerName?` | 「GLOW王座5度防衛達成」+「小百合 の挑戦を退ける」 |
| `ppvMainEvent` | `won`, `isSummit`, `opponentName?` | サミット優勝/準優勝 4分岐 (下記§3.1) |
| `juniorTournament` | `result` (champion/runnerUp/semiFinal/quarterFinal), `finalOpponentName?`, `eliminatedByName?` | 結果 4分岐 (下記§3.2) |
| `domeMain` | `result` (win/lose/draw), `matchType` (title/main), `opponentName?` | 「ドーム大会 メインイベント 勝利（vs 黒澤）」 |

### 2.3 対抗戦・期待カード

| type | 主要フィールド | 年表テキスト例 |
|---|---|---|
| `war` | `opponentOrg`, `opponentName?`, `won` | 「対抗戦 vs TOKYO 勝利（黒澤 戦）」 |
| `summit` | `won` | 「頂上決戦 勝利」 |
| `b3Challenge` | `opponentOrgName`, `won` | 「BLITZへの挑戦状 勝利」 |
| `b3Decline` | `orgName` | 「TOKYOからの挑戦状を辞退」 |
| `b3Rejected` | `rejectedByOrg` | 「挑戦状を相手団体に拒絶される」 |

### 2.4 表彰式

| type | 年表テキスト |
|---|---|
| `awardRookie` | 「🌟 新人王 受賞」 |
| `awardMVP` | 「👑 MVP 受賞」 |
| `awardMedia` | 「📺 メディア功労賞 受賞」 |
| `awardBestMatch` | 「🎬 ベストマッチ賞（試合評価 N）」 |

### 2.5 成長

| type | 年表 |
|---|---|
| `peakOVR` | 「全盛期 OVR N」 |
| `breakthrough` | (年表非表示。peakOVR と重複のため抑制) |

---

## 3. 表示ルールの細部

### 3.1 ppvMainEvent 4分岐

| isSummit | won | テキスト | 詳細 |
|---|---|---|---|
| true | true | PPV GRAND FINAL 優勝 | 決勝で {opp} を破る |
| true | false | PPV GRAND FINAL 準優勝 | 決勝で {opp} に敗れる |
| false | true | PPV GRAND FINAL 出場 | {opp} に勝利 |
| false | false | PPV GRAND FINAL 出場 | {opp} に敗れる |

### 3.2 juniorTournament 4分岐

| result | テキスト | 詳細 |
|---|---|---|
| champion | ジュニアトーナメント 優勝 | 決勝で {opp} を破る |
| runnerUp | ジュニアトーナメント 準優勝 | 決勝で {opp} に敗れる |
| semiFinal | ジュニアトーナメント 準決勝敗退 | {opp} に敗れて敗退 |
| quarterFinal | ジュニアトーナメント 出場（準々決勝敗退） | {opp} に敗れて敗退 |

### 3.3 タイトル防衛掲載閾値

`count === 3 || count === 5 || count === 7 || (count >= 10 && count % 5 === 0)`

→ 3, 5, 7, 10, 15, 20, 25... を年表に出す。それ以外は内部記録のみで非表示。

### 3.4 default fallback

`Engine.milestone.get` の switch で未知 type は **読み捨て**(描画しない)。英字 type 名が UI に漏れる事故を防ぐ。

---

## 4. 発火点

下記の関数群で history.push が行われる:

- `Engine.career.recordTitleWin/Loss/Defense` ([src/management.js](../src/management.js))
- `Engine.title.crownChampion/recordDefense` (内部で record* 系を呼ぶ)
- 興行確定 (`Engine.show.execute` / `App.finalizeShow` のタイトル戦処理)
- AI 団体タイトル経路 (`processAIWeek` 内)
- 対抗戦 (`App.finalizeWar` プレイヤー側 + AI 側 + `processAIWeek` の AI vs AI)
- ドーム大会 (`App.finalizeShow` の domeMain 処理)
- PPV (`Engine.ppv.finalize` の `_addPpvEvent`)
- ジュニアトーナメント (`Engine.juniorTournament.apply` の updateFighter)
- 解雇 (`App.releaseFighter`)
- 突然退団 (trust 経由 = `processAIWeek` 周辺の checkSuddenDepartures、契約交渉経由 = `Engine.contract.resolveNegotiation`)
- 契約満了退団 (`Engine.contract.processDeparture` cause='contractEnd')
- 引退撤回 (`App.doRetainFighter`)
- レンタル (`Engine.rental.requestRental` / `Engine.rental.processWeeklyRental`)
- 過去対戦履歴デッち上げ (`Engine.career.generateInheritedRecords`、ゲーム開始時)

---

## 5. UI レンダリング

[src/ui-common.js](../src/ui-common.js) 選手ポップアップ「戦績・経歴」タブ:

- 上部: 戦績サマリー(対抗戦勝敗 / MVP / 新人王 / ベストマッチ / メディア功労賞のカウント)
- 中部: **キャリア年表** — シーズン別 `<details>` で折りたたみ。現在シーズンは open。各行は `週フィールド + アイコン + テキスト + (詳細)` の 3 段
- 下部: 怪我・重大事項セクション(`careerHistory[]` 由来、injury_retirement 等)

週表記は `${week}週`(week=0 のときは `—`)、シーズン見出しは `${s}年目`。**英字表記禁止**(CLAUDE.md「プレイヤー向け表記に内部変数名を使わない」)。

---

## 6. 実装フェーズ履歴

- **Phase A** (2026-04-27): 表記の日本語化(Season/Week → 年目/週)、ベストマッチ MQ → 試合評価、未知 type の default fallback を読み捨てに
- **Phase B** (2026-04-27): `ppvMainEvent` / `juniorTournament` / `domeMain` / `b3*` の case 追加、breakthrough は peakOVR と重複のため非表示
- **Phase C** (2026-04-27): 対戦相手名フィールドを追加(タイトル戦/対抗戦/ドーム/JT)、防衛閾値を 3/5/7/10/15/20... に細分化
- **Phase D** (2026-04-27): PPV 出場履歴に対戦相手名と勝敗、サミット 2分岐 + 非サミット 2分岐 計4パターン
- **Phase E** (2026-04-27): 退団・再契約経緯 6 type 追加(`release` / `contractEnd` / `suddenDeparture` / `retireRetracted` / `rentalIn` / `rentalOut`)
