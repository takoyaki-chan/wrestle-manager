# 選手経歴年表 仕様書 v1.0

最終更新: 2026-09-25 (面白さ総点検 06-①/03-⑦: 天頂戦など7種+開眼の行、引退理由の実キー、「特記事項なし」の判定、殿堂の実績欄・引退セレモニーの経歴欄)
前回: 2026-05-02 (転生前データ別人扱い対応)

## 概要

選手ポップアップ「戦績・経歴」タブで描画される **キャリア年表** の仕様。`fighter.careerRecord.history[]` に蓄積されたイベントを `Engine.milestone.get(G, fighterId)` でマイルストーン形式に変換し、シーズン別折りたたみ + 行ごとに「アイコン + テキスト + 詳細(任意)」で表示する。

ゲームの魂(CLAUDE.md 三本柱「キャラクターの人生を覗き見る」)を支える中核 UI。

## 0. 入団以降のみ表示・集計（転生前は別人扱い） — 2026-05-02 追加

NPC は団体生成時にフィクションのキャリア事前史（プロデビュー・タイトル戴冠・怪我など `season:1〜N`）が打たれている。プレイヤー団体に入団した瞬間からが「現役の人物」であり、それ以前は「別人の人生」として扱う。

### 0.1 joinSeason の定義
`Engine.career.joinSeason(fighter)` が「キャリア起点」を返す。優先順位:
1. `history` 中の最古の `transfer` (toOrg=='player')
2. `history` 中の最古の `rentalIn` (toOrg=='player' or undefined)
3. `history` 中の最初の `debut` イベントの `season`
4. いずれも無ければ `null`（フィルタ無効化、全期間表示）

### 0.2 適用範囲
以下すべてが post-join（`season >= joinSeason` のみ）で集計・表示される:
- 戦績・経歴タブの「キャリア年表」（`Engine.milestone.get`）
- 戦績・経歴タブの「怪我・重大事項」セクション
- 戦績ヘッダ（勝敗・タイトル歴・JT/PPV優勝・対抗戦・MVP/新人王/ベストマッチ/メディア功労賞）
- 殿堂入りポイント（`Engine.awards.calcHofPoints`）と HOF エントリ構築（`_buildHofEntry`、`buildCareerHighlights`、`generateEpithet`）
- クロニクル候補プール（`Engine.chronicle._collectCandidates`）と章生成（`_classifyAceQuoteCategory`、`buildAceQuote`、`fighterArchive` 登録）
- 引退時のキャリアサマリー（`Engine.retirement.buildCareerSummary`）
- 「タイトルを獲ったことがある選手か」判定（引退勧告レート、スカウトカテゴリ等）
- 新聞記事の「王座奪い合い」検出・タイトル戴冠回数

### 0.3 表記ルール
- キャリア年表のシーズン見出しは **キャリア相対年数** で表示する（入団＝キャリア1年目）
- `[キャリア${s}年目]`（例: 入団直後の選手は `[キャリア1年目]`）
- 怪我・重大事項セクションも同様に `キャリア${s}年目`
- season_end プレースホルダーも `キャリア${s}年目 終了`
- debut マイルストーンは入団先の団体名を本文に含める: `${orgName} に${via日本語}入団`
- transfer マイルストーンは前所属と新所属を両方含める: `${fromOrg} から ${toOrg} へ移籍`（`'player'` は `G.orgName` に解決）

### 0.4 データ保持
転生前データは **削除しない**。`careerRecord.history` には全期間の生データが残る（後方互換）。表示・集計時に joinSeason フィルタをかぶせるだけ。
ただし `fighterArchive` 登録時のみ、保存サイズ最適化と「年代記には別人を載せない」原則のため、post-join のみをコピーする。

### 0.5 ヘルパ API
- `Engine.career.joinSeason(fighter): number | null`
- `Engine.career.filterPostJoin(history, joinSeason): HistoryEvent[]`
- `Engine.career.relSeason(absSeason, joinSeason): number` — 絶対 season → キャリア相対年（最小1）

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
| `retire` | 引退 | `age`, `reason`(下表) | 「引退（29歳）」+「ラストランを終えて」 |
| `retireRetracted` | 引退撤回 | `orgName` | 「引退を撤回し KINGS に復帰」 |
| `rentalIn` | レンタル加入 | `fromOrg`, `toOrg`, `seasons` | 「KINGSから GLOW へレンタル加入（2期）」 |
| `rentalOut` | レンタル期間満了で帰団 | `fromOrg`, `toOrg` | 「レンタル期間満了で KINGS へ帰団」 |

**`retire.reason` の実際の値と注記(2026-09-25):**

| reason | 記録する経路 | 注記 |
|---|---|---|
| `wearInjury` | 興行中の怪我引退(`Engine.show.retireInjuredFighter`。エンジンと実プレイの両方。2026-09-26 K-1 第4段 4-B-6 より前は実プレイでは起きなかった) | 度重なる怪我により |
| `careerEnding` | 同上(壊滅的な怪我=壮絶な幕切れ) | 重傷により現役続行不可 |
| `injury` | AI団体の怪我引退 | 怪我による引退 |
| `lastrun` | ラストラン後の引退(App) | ラストランを終えて |
| `motivation` | モチベ喪失による引退(App) | モチベーション喪失により |
| `contractEnd` / `sudden` | 契約交渉からの引退(`processDeparture`) | 契約満了を機に / 突然の退団とともに |
| なし / `career` | 季末の引退(`commitRetirements`)・AIの季末引退 | 注記なし(年齢は本文に出る) |

旧来の想定キー `injury_wear` / `injury_career_ending` / `age` は1件も記録されていなかったが、互換のため同じ注記で引く。

### 2.2 タイトル・トーナメント

| type | 主要フィールド | 年表テキスト例 |
|---|---|---|
| `titleWin` | `beltId`, `orgName`, `defeatedName?` | 「GLOW王座 獲得」+「美鈴 を破ってチャンピオンに」 |
| `titleLoss` | `beltId`, `orgName`, `defenses`, `dethronedByName?` | 「GLOW王座 陥落」+「白井 に敗れ陥落・12度防衛の末に陥落」 |
| `titleDefense` | `beltId`, `orgName`, `count`, `lastChallengerName?` | 「GLOW王座5度防衛達成」+「小百合 の挑戦を退ける」 |
| `ppvMainEvent` | `won`, `isSummit`, `opponentName?` | サミット優勝/準優勝 4分岐 (下記§3.1) |
| `juniorTournament` | `result` (champion/runnerUp/semiFinal/quarterFinal), `finalOpponentName?`, `eliminatedByName?` | 結果 4分岐 (下記§3.2) |
| `domeMain` | `result` (win/lose/draw), `matchType` (title/main), `opponentName?` | 「ドーム大会 メインイベント 勝利（vs 黒澤）」 |
| `ppvTournament` | `result` (champion/runnerUp/semiFinal/quarterFinal/firstRound)。週は持たない(開催週48に置く) | 「天頂戦 優勝」「天頂戦 準決勝敗退」「天頂戦 出場（1回戦敗退）」 |
| `unifiedTitle` | `result` (won/captured/defense)、`selfOvr?`/`oppOvr?` | 「全国統一王座 戴冠(第1代)」「全国統一王座 奪取」「全国統一王座 2度目の防衛」(防衛は戴冠/奪取からの通し番号) |
| `autumnWar` | `result` (champion/runnerUp/semiFinal)、`wins`(本人の勝ち星)。週は持たない(開催週36に置く) | 「4団体勝ち残り対抗戦 優勝」+「個人3勝」 |
| `mqAllTimeRecord` | `mq`, `stage`(JAラベル), `won`, `opponentName` | 「歴代最高評価を更新（試合評価 92）」+「天頂戦・○○ に勝利」 |
| `tenchosenBestBout` / `juniorTournamentBestBout` | `mq`, `round`(天頂戦はJAラベル/ジュニアは内部キー), `won`, `opponentName` | 「天頂戦 大会ベストバウト（試合評価 88）」+「準決勝・○○ に敗れる」 |
| `kaigan` | `opponentName`, `won`, `mq`(開眼の発火時に `Engine.kaigan.processMatchResults` が積む) | 「格上との一戦を境に開眼」+「○○ に敗れる」 |

**戦歴サマリー（団体別ブレークダウン）:** `Engine.career.buildSummary` は `titleWin` / `titleDefense` / `titleLoss` の `orgName` で団体別にグルーピングし、`titleByOrg = [{ orgName, wins, defenses }]` を返す。選手詳細の戦歴パネルでは複数団体を渡り歩いた選手は団体ごとに 1 行ずつ「元○○団体王座 N度戴冠・通算M度防衛」を縦並びで表示する。殿堂入り判定 (`Engine.awards.calcHofPoints`) は団体を区別せず合算（`totalTitleWins` + `totalDefenses`）で扱う。

### 2.3 対抗戦・期待カード

| type | 主要フィールド | 年表テキスト例 |
|---|---|---|
| `war` | `opponentOrg`, `opponentName?`, `won` | 「対抗戦 vs TOKYO 勝利（黒澤 戦）」 |
| `summit` | `won` | 「頂上決戦 勝利」 |
| `b3Challenge` | `opponentOrgName`, `won` | 「BLITZへの挑戦状 勝利」 |
| `b3Decline` | `orgName` | 「TOKYOからの挑戦状を辞退」 |
| `b3Rejected` | `rejectedByOrg` | 「挑戦状を相手団体に拒絶される」 |
| `feud` | `resolution` (talk/match/ignore), `won`, `opponentName`(AI団体の選手間対立) | 「○○ との確執」+「話し合いで収束」「リング上の決着戦に勝利」「団体は静観」 |

### 2.4 表彰式

| type | 年表テキスト |
|---|---|
| `awardRookie` | 「🌟 新人王 受賞」 |
| `awardMVP` | 「👑 MVP 受賞」 |
| `awardMedia` | 「📺 メディア功労賞 受賞」 |
| `awardBestMatch` | 「🎬 ベストマッチ賞（試合評価 N）」 |

**受賞対象範囲（v1.1 以降）:** 上記の受賞イベントは**プレイヤー団体・NPC団体ともに**記録される。NPC団体ごとに内部表彰（その団体の年間 MVP / 新人王 / ベストマッチ）を選出し、`careerRecord.history` に push する。プレイヤー団体の表彰式画面には載せず、選手詳細の戦歴・キャリア年表からのみ参照できる暗黙の事実として残る。各イベントには `orgName`（受賞時の所属団体名）を保持し、後年 NPC 出身選手をスカウト/獲得した際に「○○団体時代の MVP」を可視化する。メディア功労賞は団体横断の単独選出のためそのまま。

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
記録されるのに描かない type は、現在 `breakthrough`(careerHistory 側の行で出る)・`bigMatch`・`practiceInjury`・
`talentActivity`・`mediaSpotlight`・`challenge_request_match`・`retain`(いずれも内部記録)。

### 3.5 「特記事項なし」の判定(2026-09-25)

完了した年に年表の行が1本も無いとき、`season_end` の区切りを置く。**「特記事項なし」と書くのは、その年の記録
(`careerRecord.history` と `careerHistory`)が1件も無いときだけ**(`quiet: true`)。記録はあるが行にならない年
(上の内部記録だけの年)は注記を付けず(`quiet: false`)、UI は本文に「—」だけを置く。
以前は「行が無い年」で判定していたので、年表が描けなかった天頂戦の優勝年が「特記事項なし」になっていた。

### 3.6 殿堂の実績欄(`Engine.awards.buildCareerHighlights`)との関係(2026-09-25)

- **不変条件: `calcHofPoints` が数える type は、すべて殿堂の実績欄と経歴年表が描く**
  (`test/career-record-display-coverage-test.js`。数える type は calcHofPoints のソースから機械抽出)。
- 実績欄に天頂戦(優勝/準優勝/ベスト4)・4団体勝ち残り対抗戦(優勝/3人抜き以上/2大会以上の通算勝ち星)・
  開眼を追加。PPV GRAND FINAL の優勝は `{ isSummit, won }` で判定(以前は result を見ていて出ていなかった)。
- 王座の行の `{org}` は団体名(記録の orgName はベルト名「○○王座」なので末尾の「王座」を外す)。
  以前は「○○王座王座 初戴冠」になっていた。
- 殿堂の詳細画面は、エントリに残る `careerRecord` から**再生成した実績欄**を正とする(保存値は素材の無い旧エントリだけ)。
- 年代記の章ハイライト(`Engine.chronicle._buildHighlights`)にも天頂戦・4団体勝ち残り対抗戦・全国統一王座を追加。
- 殿堂の異名(`Engine.awards.generateEpithet`)の数字入り10本(三度の頂・二度の戴冠・三度の栄冠・二度の最優秀・
  MVP二冠・三年王朝・三連覇の怪物・二連覇の衝撃・世代を二度制した女・10年選手)は、実際の回数と一致するときだけ
  候補にする(`_EPITHET_COUNT_RULES`)。タグの条件は「以上」なので、「三度の頂」が4〜7回戴冠した選手にも付いていた。
  既に保存された異名は書き換えない。

### 3.7 引退セレモニーの経歴欄(`Engine.retirement.buildCareerSummary`)(2026-09-25)

「入団」+「その選手らしい瞬間(最大3つ・時系列)」+「全盛期」。瞬間は `Engine.retirement.pickCareerMoments` が選ぶ:
候補は殿堂の実績欄(`buildCareerHighlights(..., { withKind: true })`)と、実績欄に載らない年表の出来事
(大会の上位・大会ベストバウト・歴代最高評価・対抗戦の勝利など)。種類ごとに1件(大きさ最大、同じなら最初)、
系統ごとの上限(王座と全国統一王座は2つ、ほかは1つ。天頂戦の優勝と統一王座の戴冠は同じ系統)、表示用の重み
(`MOMENT_WEIGHTS`、ゲームの数値には関与しない)の大きい順に3つ。移籍で加わった選手は自団体への移籍を入団の行にする。
以前は記録されない type `summit` を探し、大会成績と受賞を拾わず、王座の獲得/陥落を1件ずつ並べていた。

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
- **2026-09-25(面白さ総点検 06-①/03-⑦)**: 読み捨てていた7種(`ppvTournament`/`unifiedTitle`/`autumnWar`/`mqAllTimeRecord`/`tenchosenBestBout`/`juniorTournamentBestBout`/`feud`)と開眼(`kaigan`、履歴への記録も新設)の行を追加。引退理由を実キーで引く。「特記事項なし」を記録の有無で判定(§3.5)。殿堂の実績欄・年代記・引退セレモニーの経歴欄(§3.6/§3.7)
